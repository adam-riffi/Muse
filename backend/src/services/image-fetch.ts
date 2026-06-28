export type FetchedImage = {
  buffer: Buffer;
  contentType: string;
  bytes: number;
};

export type FetchImageOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  fetchImpl?: typeof fetch;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
// Some CDNs serve images with a generic or missing content-type; allow those through and let the
// image decoder (sharp) validate the actual bytes. Explicit non-image types (text/html, json) stay
// rejected so we never download an HTML error page as an "image".
const PASSTHROUGH_TYPES = new Set(['', 'application/octet-stream', 'binary/octet-stream']);

// A browser-like User-Agent + Accept dramatically improves success against image hosts that block
// non-browser clients (a common reason thumbnails fail to load).
const REQUEST_HEADERS: Record<string, string> = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'image/avif,image/webp,image/apng,image/png,image/jpeg,*/*',
};

export class ImageFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageFetchError';
  }
}

// Fetch a remote image with defensive guards: timeout (AbortController), content-type allow-list,
// and a max-size cap (declared Content-Length and actual bytes). fetch is injectable for testing.
export async function fetchImage(
  url: string,
  options: FetchImageOptions = {},
): Promise<FetchedImage> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
    fetchImpl = fetch,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: REQUEST_HEADERS,
    });
    if (!response.ok) {
      throw new ImageFetchError(`Image fetch failed with status ${response.status}`);
    }

    const contentType = (response.headers.get('content-type') ?? '')
      .split(';')[0]!
      .trim()
      .toLowerCase();
    if (!ALLOWED_TYPES.has(contentType) && !PASSTHROUGH_TYPES.has(contentType)) {
      throw new ImageFetchError(`Unsupported content-type: ${contentType || 'unknown'}`);
    }

    const declared = Number(response.headers.get('content-length') ?? '0');
    if (declared > maxBytes) {
      throw new ImageFetchError(`Image exceeds ${maxBytes} bytes (declared ${declared})`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new ImageFetchError(`Image exceeds ${maxBytes} bytes`);
    }

    return { buffer, contentType, bytes: buffer.byteLength };
  } finally {
    clearTimeout(timer);
  }
}
