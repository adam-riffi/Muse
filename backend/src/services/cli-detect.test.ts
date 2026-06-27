import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config.js';
import { detectAgentCli, detectCli } from './cli-detect.js';

describe('detectCli', () => {
  it('detects a present binary and parses its version (node)', async () => {
    const result = await detectCli('node');
    expect(result.available).toBe(true);
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('reports a missing binary as unavailable (never rejects)', async () => {
    const result = await detectCli('muse-definitely-not-a-real-binary-xyz');
    expect(result).toEqual({ available: false, version: null });
  });
});

describe('detectAgentCli', () => {
  it('reports the configured provider and binary', async () => {
    const codex = await detectAgentCli(loadConfig({ NODE_ENV: 'test' }));
    expect(codex).toMatchObject({ provider: 'codex', bin: 'codex' });

    const copilot = await detectAgentCli(loadConfig({ NODE_ENV: 'test', AGENT_CLI: 'copilot' }));
    expect(copilot).toMatchObject({ provider: 'copilot', bin: 'copilot' });
  });
});
