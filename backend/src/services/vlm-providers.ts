import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import type { AppConfig } from '../config.js';
import { extractLastCopilotMessage } from '../adapters/agent-runner.js';
import type { VlmImage, VlmProvider } from './vlm.js';

type FetchFn = typeof fetch;

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-latest';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_OPENAI_MODEL = 'gpt-4o';

const MAX_TOKENS = 1024;

export class VlmProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VlmProviderError';
  }
}

export type AnthropicDeps = { fetchImpl?: FetchFn; endpoint?: string; model?: string };

export function createAnthropicProvider(apiKey: string, deps: AnthropicDeps = {}): VlmProvider {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const endpoint = deps.endpoint ?? ANTHROPIC_ENDPOINT;
  const model = deps.model ?? DEFAULT_ANTHROPIC_MODEL;
  return {
    name: 'anthropic',
    async complete(prompt, images) {
      const content = [
        { type: 'text', text: prompt },
        ...images.map((image: VlmImage) => ({
          type: 'image',
          source: { type: 'base64', media_type: image.mediaType, data: image.data },
        })),
      ];
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: MAX_TOKENS,
          messages: [{ role: 'user', content }],
        }),
      });
      if (!response.ok) {
        throw new VlmProviderError(`Anthropic request failed with status ${response.status}`);
      }
      const body = (await response.json()) as { content?: { type?: string; text?: string }[] };
      return (body.content ?? [])
        .filter((block) => block.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n');
    },
  };
}

export type OpenAiDeps = { fetchImpl?: FetchFn; endpoint?: string; model?: string };

export function createOpenAiProvider(apiKey: string, deps: OpenAiDeps = {}): VlmProvider {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const endpoint = deps.endpoint ?? OPENAI_ENDPOINT;
  const model = deps.model ?? DEFAULT_OPENAI_MODEL;
  return {
    name: 'openai',
    async complete(prompt, images) {
      const content = [
        { type: 'text', text: prompt },
        ...images.map((image: VlmImage) => ({
          type: 'image_url',
          image_url: { url: `data:${image.mediaType};base64,${image.data}` },
        })),
      ];
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content }] }),
      });
      if (!response.ok) {
        throw new VlmProviderError(`OpenAI request failed with status ${response.status}`);
      }
      const body = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return body.choices?.[0]?.message?.content ?? '';
    },
  };
}

// --- Copilot CLI vision provider (no API key) ---------------------------------------------------
// Drives the locally-authenticated GitHub Copilot CLI for vision: write the kept images to temp
// files, attach them with `--attachment`, and run a one-shot prompt. Lets synthesis work without an
// Anthropic/OpenAI key — the same "use the local agent CLI" idea as discovery.

const COPILOT_VLM_TIMEOUT_MS = 180_000;
const VLM_IMAGE_MAX_DIM = 768;

export type CopilotVlmExec = (
  prompt: string,
  attachmentPaths: string[],
  model?: string,
) => Promise<string>;

function copilotErrorFrom(stdout: string): string | null {
  for (const line of stdout.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '') continue;
    try {
      const event = JSON.parse(trimmed) as { type?: string; data?: { message?: unknown } };
      if (event.type === 'session.error' && typeof event.data?.message === 'string') {
        return event.data.message.slice(0, 200);
      }
    } catch {
      // ignore
    }
  }
  return null;
}

// Translate a raw GitHub Copilot CLI error into a clear, actionable message so the user learns the
// *actual* problem (and how to recover) instead of a cryptic CLI string. Unrecognized errors are
// returned unchanged.
export function describeCopilotError(raw: string): string {
  const text = raw.toLowerCase();
  const switchHint =
    'set VLM_PROVIDER=anthropic or VLM_PROVIDER=openai (with the matching API key) in backend/.env';
  if (text.includes('quota')) {
    return `Your GitHub Copilot monthly request quota is used up, so the vision model can't run. Wait for it to reset, or ${switchHint}.`;
  }
  if (
    text.includes('rate limit') ||
    text.includes('rate-limit') ||
    text.includes('too many requests') ||
    text.includes('429')
  ) {
    return `GitHub Copilot is rate-limiting requests right now. Wait a moment and try again, or ${switchHint}.`;
  }
  if (
    text.includes('unauthorized') ||
    text.includes('401') ||
    text.includes('not logged in') ||
    text.includes('sign in') ||
    text.includes('authenticat')
  ) {
    return `The GitHub Copilot CLI isn't signed in. Run \`copilot\` to authenticate, or ${switchHint}.`;
  }
  return raw;
}

const runCopilotWithAttachments: CopilotVlmExec = async (prompt, attachmentPaths, model) => {
  const bin = process.env.COPILOT_BIN ?? 'copilot';
  const args = [
    '--allow-all-tools',
    '--output-format',
    'json',
    '--no-color',
    '--log-level',
    'none',
  ];
  if (model !== undefined) {
    args.push('--model', model);
  }
  for (const path of attachmentPaths) {
    args.push('--attachment', path);
  }
  args.push('-p', prompt);

  const cwd = await mkdtemp(join(tmpdir(), 'muse-vlm-cwd-'));
  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      const timer = setTimeout(() => child.kill('SIGKILL'), COPILOT_VLM_TIMEOUT_MS);
      child.stdout?.on('data', (chunk: Buffer) => {
        out += chunk.toString();
      });
      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on('close', () => {
        clearTimeout(timer);
        resolve(out);
      });
    });

    const message = extractLastCopilotMessage(stdout);
    if (message === null) {
      throw new VlmProviderError(
        describeCopilotError(copilotErrorFrom(stdout) ?? 'Copilot CLI returned no analysis'),
      );
    }
    return message;
  } finally {
    await rm(cwd, { recursive: true, force: true }).catch(() => undefined);
  }
};

export type CopilotVlmDeps = { exec?: CopilotVlmExec; model?: string };

export function createCopilotVlmProvider(deps: CopilotVlmDeps = {}): VlmProvider {
  const exec = deps.exec ?? runCopilotWithAttachments;
  return {
    name: 'copilot',
    async complete(prompt, images: readonly VlmImage[]) {
      const dir = await mkdtemp(join(tmpdir(), 'muse-vlm-'));
      const paths: string[] = [];
      try {
        for (const [index, image] of images.entries()) {
          // Normalize to a sane-sized PNG so the CLI reliably accepts the attachment.
          const png = await sharp(Buffer.from(image.data, 'base64'))
            .resize(VLM_IMAGE_MAX_DIM, VLM_IMAGE_MAX_DIM, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .png()
            .toBuffer();
          const path = join(dir, `image-${index}.png`);
          await writeFile(path, png);
          paths.push(path);
        }
        return await exec(prompt, paths, deps.model);
      } finally {
        await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      }
    },
  };
}

// Selects a VLM provider from config. Returns null when disabled ('none') or when the chosen
// provider has no API key — callers surface that as "no VLM configured".
export function createVlmProvider(config: AppConfig): VlmProvider | null {
  const model = config.vlmModel;
  switch (config.vlmProvider) {
    case 'anthropic':
      return config.anthropicApiKey !== undefined
        ? createAnthropicProvider(config.anthropicApiKey, model !== undefined ? { model } : {})
        : null;
    case 'openai':
      return config.openaiApiKey !== undefined
        ? createOpenAiProvider(config.openaiApiKey, model !== undefined ? { model } : {})
        : null;
    case 'copilot':
      return createCopilotVlmProvider(model !== undefined ? { model } : {});
    default:
      return null;
  }
}
