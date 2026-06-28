import {
  type ImageCandidate,
  ImageCandidateSchema,
  ImageSource,
  type ImageSourceTag,
} from '@muse/shared';
import { imageId } from '@muse/shared/hash';
import type { AppConfig } from '../config.js';

// A permissive, optional image source: an alternative to the Codex websearch seam that returns
// ImageCandidate[] directly from a public image API. Openverse needs no key (default); Unsplash
// is enabled behind an access key.
export type ImageSourceProvider = {
  readonly name: ImageSourceTag;
  search(query: string, count: number): Promise<ImageCandidate[]>;
};

type FetchFn = typeof fetch;

export class ImageSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageSourceError';
  }
}

const OPENVERSE_ENDPOINT = 'https://api.openverse.org/v1/images/';
const UNSPLASH_ENDPOINT = 'https://api.unsplash.com/search/photos';
const DEFAULT_COUNT = 12;
const MAX_COUNT = 24;

function clampCount(count: number): number {
  if (!Number.isFinite(count)) {
    return DEFAULT_COUNT;
  }
  return Math.max(1, Math.min(Math.trunc(count), MAX_COUNT));
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function toCandidate(
  url: unknown,
  pageUrl: unknown,
  title: unknown,
  source: ImageSourceTag,
  query: string,
): ImageCandidate | null {
  const directUrl = asString(url);
  if (directUrl === undefined) {
    return null;
  }
  const page = asString(pageUrl);
  const label = asString(title);
  const parsed = ImageCandidateSchema.safeParse({
    id: imageId(directUrl),
    source,
    url: directUrl,
    ...(page !== undefined ? { pageUrl: page } : {}),
    ...(label !== undefined ? { title: label } : {}),
    rationale: `${source} result for "${query}"`,
  });
  return parsed.success ? parsed.data : null;
}

function dedupe(candidates: ImageCandidate[]): ImageCandidate[] {
  const seen = new Set<string>();
  const out: ImageCandidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) {
      continue;
    }
    seen.add(candidate.id);
    out.push(candidate);
  }
  return out;
}

export type OpenverseDeps = { fetchImpl?: FetchFn; endpoint?: string };

export function createOpenverseSource(deps: OpenverseDeps = {}): ImageSourceProvider {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const endpoint = deps.endpoint ?? OPENVERSE_ENDPOINT;
  return {
    name: ImageSource.Openverse,
    async search(query, count) {
      const url = new URL(endpoint);
      url.searchParams.set('q', query);
      url.searchParams.set('page_size', String(clampCount(count)));
      const response = await fetchImpl(url.toString(), { headers: { accept: 'application/json' } });
      if (!response.ok) {
        throw new ImageSourceError(`Openverse request failed with status ${response.status}`);
      }
      const body = (await response.json()) as { results?: unknown };
      const results = Array.isArray(body.results) ? body.results : [];
      const candidates: ImageCandidate[] = [];
      for (const raw of results) {
        const item = raw as Record<string, unknown>;
        const candidate = toCandidate(
          item.url,
          item.foreign_landing_url,
          item.title,
          ImageSource.Openverse,
          query,
        );
        if (candidate !== null) {
          candidates.push(candidate);
        }
      }
      return dedupe(candidates);
    },
  };
}

export type UnsplashDeps = { fetchImpl?: FetchFn; endpoint?: string };

export function createUnsplashSource(
  accessKey: string,
  deps: UnsplashDeps = {},
): ImageSourceProvider {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const endpoint = deps.endpoint ?? UNSPLASH_ENDPOINT;
  return {
    name: ImageSource.Unsplash,
    async search(query, count) {
      const url = new URL(endpoint);
      url.searchParams.set('query', query);
      url.searchParams.set('per_page', String(clampCount(count)));
      const response = await fetchImpl(url.toString(), {
        headers: { accept: 'application/json', authorization: `Client-ID ${accessKey}` },
      });
      if (!response.ok) {
        throw new ImageSourceError(`Unsplash request failed with status ${response.status}`);
      }
      const body = (await response.json()) as { results?: unknown };
      const results = Array.isArray(body.results) ? body.results : [];
      const candidates: ImageCandidate[] = [];
      for (const raw of results) {
        const item = raw as {
          urls?: Record<string, unknown>;
          links?: Record<string, unknown>;
          description?: unknown;
          alt_description?: unknown;
        };
        const candidate = toCandidate(
          item.urls?.regular,
          item.links?.html,
          item.description ?? item.alt_description,
          ImageSource.Unsplash,
          query,
        );
        if (candidate !== null) {
          candidates.push(candidate);
        }
      }
      return dedupe(candidates);
    },
  };
}

// Selects a provider from config. Returns null when disabled ('none') or when Unsplash is
// requested without an access key — callers surface that as "no image source configured".
export function createImageSource(config: AppConfig): ImageSourceProvider | null {
  switch (config.imageSource) {
    case 'openverse':
      return createOpenverseSource();
    case 'unsplash':
      return config.unsplashAccessKey !== undefined
        ? createUnsplashSource(config.unsplashAccessKey)
        : null;
    default:
      return null;
  }
}
