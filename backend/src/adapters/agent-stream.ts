// Normalized, UI-facing progress events emitted while an agent CLI works. Both Codex and Copilot
// stream JSONL; these normalizers map each provider's events to one small, vendor-neutral shape so
// the frontend can show "what the agent is thinking / searching" live.
import type { AgentStreamEvent } from '@muse/shared';

export type { AgentStreamEvent };

export type StreamNormalizer = (parsed: unknown) => AgentStreamEvent | null;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// Codex `exec --json`: surfaces its web searches (`item.completed` of type `web_search`, with a
// populated `query`) and lifecycle starts. The final `agent_message` is consumed by the parser, not
// shown as progress.
export function normalizeCodexEvent(parsed: unknown): AgentStreamEvent | null {
  const event = asRecord(parsed);
  if (event === null) {
    return null;
  }
  if (event.type === 'thread.started') {
    return { kind: 'status', text: 'Starting the agent…' };
  }
  if (event.type === 'turn.started') {
    return { kind: 'status', text: 'Searching the web…' };
  }
  if (event.type === 'item.completed') {
    const item = asRecord(event.item);
    if (item?.type === 'web_search') {
      const query = asString(item.query);
      if (query !== null) {
        return { kind: 'search', query };
      }
    }
  }
  return null;
}

const WEB_TOOL_PATTERN = /fetch|search|web|browse|http/i;

// Copilot `--output-format json`: streams its chain-of-thought (`assistant.reasoning_delta`) and tool
// activity (`tool.execution_start`). Web tools surface the URL/query being fetched.
export function normalizeCopilotEvent(parsed: unknown): AgentStreamEvent | null {
  const event = asRecord(parsed);
  if (event === null) {
    return null;
  }
  const data = asRecord(event.data);
  if (event.type === 'assistant.reasoning_delta' && data !== null) {
    const text = asString(data.deltaContent);
    return text !== null ? { kind: 'reasoning', text } : null;
  }
  if (event.type === 'tool.execution_start' && data !== null) {
    const name = asString(data.toolName) ?? 'tool';
    const args = asRecord(data.arguments);
    const target = args !== null ? (asString(args.url) ?? asString(args.query)) : null;
    if (WEB_TOOL_PATTERN.test(name)) {
      return { kind: 'search', query: target ?? name };
    }
    return { kind: 'tool', name };
  }
  return null;
}

export function normalizerFor(provider: 'codex' | 'copilot'): StreamNormalizer {
  return provider === 'copilot' ? normalizeCopilotEvent : normalizeCodexEvent;
}
