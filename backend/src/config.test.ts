import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('applies defaults when env is empty', () => {
    expect(loadConfig({})).toEqual({
      nodeEnv: 'development',
      port: 3001,
      host: '127.0.0.1',
      logLevel: 'info',
      imageSource: 'openverse',
      vlmProvider: 'anthropic',
    });
  });

  it('coerces PORT to a number', () => {
    expect(loadConfig({ PORT: '8080' }).port).toBe(8080);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow();
  });

  it('rejects an invalid LOG_LEVEL', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'loud' })).toThrow();
  });

  it('honors provided values', () => {
    const config = loadConfig({ NODE_ENV: 'production', HOST: '0.0.0.0', LOG_LEVEL: 'warn' });
    expect(config.nodeEnv).toBe('production');
    expect(config.host).toBe('0.0.0.0');
    expect(config.logLevel).toBe('warn');
  });

  it('reads image source settings', () => {
    expect(loadConfig({ IMAGE_SOURCE: 'none' }).imageSource).toBe('none');
    const config = loadConfig({ IMAGE_SOURCE: 'unsplash', UNSPLASH_ACCESS_KEY: 'k' });
    expect(config.unsplashAccessKey).toBe('k');
  });

  it('reads VLM settings', () => {
    expect(loadConfig({ VLM_PROVIDER: 'none' }).vlmProvider).toBe('none');
    const config = loadConfig({ VLM_PROVIDER: 'openai', OPENAI_API_KEY: 'k', VLM_MODEL: 'gpt-4o' });
    expect(config.openaiApiKey).toBe('k');
    expect(config.vlmModel).toBe('gpt-4o');
  });
});
