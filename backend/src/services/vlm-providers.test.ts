import { describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../config.js';
import type { VlmImage } from './vlm.js';
import {
  VlmProviderError,
  createAnthropicProvider,
  createOpenAiProvider,
  createVlmProvider,
} from './vlm-providers.js';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

const images: VlmImage[] = [{ mediaType: 'image/png', data: 'AAAA' }];

describe('createAnthropicProvider', () => {
  it('sends image blocks and concatenates text content', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ content: [{ type: 'text', text: '{"ok":true}' }] }));
    const provider = createAnthropicProvider('key-1', { fetchImpl });
    const out = await provider.complete('prompt', images);

    expect(out).toBe('{"ok":true}');
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)['x-api-key']).toBe('key-1');
    const payload = JSON.parse(init.body as string) as {
      messages: { content: { type: string }[] }[];
    };
    const types = payload.messages[0]?.content.map((block) => block.type);
    expect(types).toEqual(['text', 'image']);
  });

  it('throws on a non-ok response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, false, 500));
    await expect(
      createAnthropicProvider('k', { fetchImpl }).complete('p', images),
    ).rejects.toBeInstanceOf(VlmProviderError);
  });
});

describe('createOpenAiProvider', () => {
  it('sends a data URI image and returns the message content', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ choices: [{ message: { content: '{"ok":1}' } }] }));
    const provider = createOpenAiProvider('key-2', { fetchImpl });
    const out = await provider.complete('prompt', images);

    expect(out).toBe('{"ok":1}');
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer key-2');
    const payload = JSON.parse(init.body as string) as {
      messages: { content: { type: string; image_url?: { url: string } }[] }[];
    };
    const imageBlock = payload.messages[0]?.content.find((block) => block.type === 'image_url');
    expect(imageBlock?.image_url?.url).toBe('data:image/png;base64,AAAA');
  });
});

describe('createVlmProvider', () => {
  it('returns null when disabled or unkeyed', () => {
    expect(createVlmProvider(loadConfig({ VLM_PROVIDER: 'none' }))).toBeNull();
    expect(createVlmProvider(loadConfig({ VLM_PROVIDER: 'anthropic' }))).toBeNull();
  });

  it('selects the configured keyed provider', () => {
    expect(
      createVlmProvider(loadConfig({ VLM_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'k' }))?.name,
    ).toBe('anthropic');
    expect(
      createVlmProvider(loadConfig({ VLM_PROVIDER: 'openai', OPENAI_API_KEY: 'k' }))?.name,
    ).toBe('openai');
  });
});
