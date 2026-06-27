import { describe, expect, it } from 'vitest';
import { buildCodexExecArgs, extractLastAgentMessage } from './codex-runner.js';

describe('buildCodexExecArgs', () => {
  it('builds the non-interactive invocation with the prompt last', () => {
    const args = buildCodexExecArgs({ prompt: 'find images' }, '/tmp/last.txt');
    expect(args).toEqual([
      'exec',
      '--json',
      '--color',
      'never',
      '--skip-git-repo-check',
      '--ephemeral',
      '--output-last-message',
      '/tmp/last.txt',
      'find images',
    ]);
  });

  it('includes the model flag when provided', () => {
    const args = buildCodexExecArgs({ prompt: 'p', model: 'gpt-5' }, '/tmp/last.txt');
    expect(args).toContain('--model');
    expect(args[args.indexOf('--model') + 1]).toBe('gpt-5');
    expect(args[args.length - 1]).toBe('p');
  });
});

describe('extractLastAgentMessage', () => {
  const stream = [
    '{"type":"thread.started","thread_id":"t1"}',
    '{"type":"turn.started"}',
    '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"[{\\"n\\":1}]"}}',
    '{"type":"turn.completed","usage":{"input_tokens":10}}',
  ].join('\n');

  it('returns the agent message text from a JSONL stream', () => {
    expect(extractLastAgentMessage(stream)).toBe('[{"n":1}]');
  });

  it('returns the last agent message when several are present', () => {
    const two = [
      '{"type":"item.completed","item":{"type":"agent_message","text":"first"}}',
      '{"type":"item.completed","item":{"type":"agent_message","text":"second"}}',
    ].join('\n');
    expect(extractLastAgentMessage(two)).toBe('second');
  });

  it('ignores non-JSON and unrelated lines', () => {
    expect(extractLastAgentMessage('garbage\n{"type":"turn.started"}\n')).toBeNull();
  });

  it('returns null for an empty stream', () => {
    expect(extractLastAgentMessage('')).toBeNull();
  });
});
