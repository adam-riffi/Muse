import type { AppConfig } from '../config.js';
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
    default:
      return null;
  }
}
