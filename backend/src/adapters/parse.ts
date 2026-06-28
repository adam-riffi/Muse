// ANSI/CSI escape-sequence stripper. Defensive: we already pass `--color never`, but parsing must
// not depend on that being honored across Codex versions.
// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /[\u001B\u009B][[\]()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]/g;

export function stripAnsi(input: string): string {
  return input.replace(ANSI_PATTERN, '');
}

// Extract the first balanced top-level JSON array via a bracket scan (not a regex) that respects
// string literals and escapes, so brackets inside string values never throw off the depth count.
// Returns the array substring (including outer brackets), or null if none is balanced.
export function extractFirstJsonArray(input: string): string | null {
  const start = input.indexOf('[');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i += 1) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '[') {
      depth += 1;
    } else if (ch === ']') {
      depth -= 1;
      if (depth === 0) {
        return input.slice(start, i + 1);
      }
    }
  }

  return null;
}

// Scan-based: respecting string literals/escapes, return the index of the `close` that balances the
// `open` at `start`, or -1 if it never balances.
function balancedEnd(input: string, start: number, open: string, close: string): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i += 1) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === open) {
      depth += 1;
    } else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

// Return EVERY balanced top-level JSON array substring, in document order. Unlike
// `extractFirstJsonArray`, this keeps scanning past a non-array bracket (e.g. a markdown link
// `[text](url)` or a stray `[1]` in the model's prose), so callers can try each candidate and pick
// the one that actually parses into the data they want.
export function extractAllJsonArrays(input: string): string[] {
  const arrays: string[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const start = input.indexOf('[', cursor);
    if (start === -1) {
      break;
    }
    const end = balancedEnd(input, start, '[', ']');
    if (end === -1) {
      cursor = start + 1;
      continue;
    }
    arrays.push(input.slice(start, end + 1));
    cursor = end + 1;
  }

  return arrays;
}
export function extractFirstJsonObject(input: string): string | null {
  const start = input.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i += 1) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return input.slice(start, i + 1);
      }
    }
  }

  return null;
}
