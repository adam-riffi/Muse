import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config.js';
import { runCodexExec } from './codex-runner.js';
import {
  buildCopilotExecArgs,
  extractLastCopilotMessage,
  resolveAgentRunner,
  runCopilotExec,
} from './agent-runner.js';

describe('buildCopilotExecArgs', () => {
  it('builds a non-interactive JSON invocation with the prompt last', () => {
    const args = buildCopilotExecArgs({ prompt: 'find images' });
    expect(args).toEqual([
      '--allow-all-tools',
      '--output-format',
      'json',
      '--no-color',
      '--log-level',
      'none',
      '-p',
      'find images',
    ]);
  });

  it('passes the model through when provided', () => {
    const args = buildCopilotExecArgs({ prompt: 'p', model: 'gpt-5.4' });
    expect(args).toContain('--model');
    expect(args[args.indexOf('--model') + 1]).toBe('gpt-5.4');
    expect(args.at(-1)).toBe('p');
  });
});

describe('extractLastCopilotMessage', () => {
  const jsonl = [
    '{"type":"session.tools_updated","data":{"model":"x"}}',
    '{"type":"assistant.message_delta","data":{"deltaContent":"["}}',
    '{"type":"assistant.message","data":{"content":"[\\"first\\"]"}}',
    '{"type":"assistant.message","data":{"content":"[{\\"url\\":\\"https://x/a.jpg\\"}]"}}',
    '{"type":"result","exitCode":0}',
  ].join('\n');

  it('returns the last terminal assistant message content', () => {
    expect(extractLastCopilotMessage(jsonl)).toBe('[{"url":"https://x/a.jpg"}]');
  });

  it('ignores malformed lines and returns null when none match', () => {
    expect(extractLastCopilotMessage('not json\n{"type":"result"}')).toBeNull();
  });
});

describe('resolveAgentRunner', () => {
  it('selects Codex by default and Copilot when configured', () => {
    expect(resolveAgentRunner(loadConfig({ NODE_ENV: 'test' }))).toBe(runCodexExec);
    expect(resolveAgentRunner(loadConfig({ NODE_ENV: 'test', AGENT_CLI: 'copilot' }))).toBe(
      runCopilotExec,
    );
  });
});
