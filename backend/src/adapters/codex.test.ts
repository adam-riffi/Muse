import { describe, expect, it } from 'vitest';
import type { CodexRunInput, CodexRunner, CodexRunResult } from './codex-runner.js';
import { CodexDiscoveryError, discoverImages } from './codex.js';

function agentLine(text: string): string {
  return JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text } });
}

function fakeRunner(results: Array<Partial<CodexRunResult>>): {
  runner: CodexRunner;
  calls: CodexRunInput[];
} {
  const calls: CodexRunInput[] = [];
  let index = 0;
  const runner: CodexRunner = (input) => {
    calls.push(input);
    const result = results[Math.min(index, results.length - 1)] ?? {};
    index += 1;
    return Promise.resolve({
      exitCode: 0,
      stdout: '',
      stderr: '',
      lastMessage: null,
      timedOut: false,
      ...result,
    });
  };
  return { runner, calls };
}

const cleanArray = '[{"url":"https://a.com/1.jpg","rationale":"fits"}]';

describe('discoverImages', () => {
  it('parses a clean last-message on the first attempt without retrying', async () => {
    const { runner, calls } = fakeRunner([{ lastMessage: cleanArray }]);
    const candidates = await discoverImages({ brief: 'x' }, { runner });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ url: 'https://a.com/1.jpg', source: 'codex:websearch' });
    expect(calls).toHaveLength(1);
  });

  it('falls back to the JSONL stream when no last-message file was written', async () => {
    const { runner } = fakeRunner([{ lastMessage: null, stdout: agentLine(cleanArray) }]);
    const candidates = await discoverImages({ brief: 'x' }, { runner });
    expect(candidates).toHaveLength(1);
  });

  it('strips ANSI and markdown fences from the message', async () => {
    const noisy = `\u001b[32m\`\`\`json\n${cleanArray}\n\`\`\`\u001b[0m`;
    const { runner } = fakeRunner([{ lastMessage: noisy }]);
    expect(await discoverImages({ brief: 'x' }, { runner })).toHaveLength(1);
  });

  it('retries once with a stricter reminder when the first output is unparseable', async () => {
    const { runner, calls } = fakeRunner([
      { lastMessage: 'sorry, here are some links instead' },
      { lastMessage: cleanArray },
    ]);
    const candidates = await discoverImages({ brief: 'x' }, { runner });
    expect(candidates).toHaveLength(1);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.prompt).toContain('could not be parsed');
  });

  it('throws CodexDiscoveryError with the raw output when both attempts fail', async () => {
    const { runner } = fakeRunner([{ lastMessage: 'nope' }, { lastMessage: 'still not json' }]);
    await expect(discoverImages({ brief: 'x' }, { runner })).rejects.toMatchObject({
      name: 'CodexDiscoveryError',
      rawOutput: 'still not json',
    });
  });

  it('exposes CodexDiscoveryError as an Error subclass', async () => {
    const { runner } = fakeRunner([{ lastMessage: 'x' }, { lastMessage: 'y' }]);
    const error = await discoverImages({ brief: 'x' }, { runner }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CodexDiscoveryError);
    expect(error).toBeInstanceOf(Error);
  });
});
