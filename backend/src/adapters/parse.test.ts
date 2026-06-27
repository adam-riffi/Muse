import { describe, expect, it } from 'vitest';
import { extractFirstJsonArray, extractFirstJsonObject, stripAnsi } from './parse.js';

describe('stripAnsi', () => {
  it('removes SGR color codes', () => {
    expect(stripAnsi('\u001b[31mred\u001b[0m')).toBe('red');
  });

  it('leaves plain text untouched', () => {
    expect(stripAnsi('[{"url":"https://a.com/x.jpg"}]')).toBe('[{"url":"https://a.com/x.jpg"}]');
  });
});

describe('extractFirstJsonArray', () => {
  it('returns a clean array unchanged', () => {
    expect(extractFirstJsonArray('[{"a":1}]')).toBe('[{"a":1}]');
  });

  it('handles nested arrays and objects', () => {
    const input = '[{"a":[1,2],"b":{"c":3}}]';
    expect(extractFirstJsonArray(input)).toBe(input);
  });

  it('extracts an array embedded in prose', () => {
    expect(extractFirstJsonArray('Here you go:\n[{"a":1}]\nDone.')).toBe('[{"a":1}]');
  });

  it('extracts an array wrapped in markdown fences', () => {
    expect(extractFirstJsonArray('```json\n[{"a":1},{"a":2}]\n```')).toBe('[{"a":1},{"a":2}]');
  });

  it('ignores brackets inside string values', () => {
    const input = '[{"rationale":"a [nice] shot with ] brackets"}]';
    expect(extractFirstJsonArray(input)).toBe(input);
  });

  it('ignores escaped quotes inside strings', () => {
    const input = '[{"t":"he said \\"hi\\" ]["}]';
    expect(extractFirstJsonArray(input)).toBe(input);
  });

  it('returns null when there is no array', () => {
    expect(extractFirstJsonArray('no json here')).toBeNull();
  });

  it('returns null for an unbalanced array', () => {
    expect(extractFirstJsonArray('[{"a":1}')).toBeNull();
  });
});

describe('extractFirstJsonObject', () => {
  it('extracts a balanced object from surrounding prose', () => {
    const input = 'Here is the analysis: {"mood":["calm"],"summary":"ok"} — done.';
    expect(extractFirstJsonObject(input)).toBe('{"mood":["calm"],"summary":"ok"}');
  });

  it('handles nested objects', () => {
    const input = '{"a":{"b":{"c":1}},"d":2}';
    expect(extractFirstJsonObject(input)).toBe(input);
  });

  it('ignores braces inside string values', () => {
    const input = '{"note":"a {curly} brace } here"}';
    expect(extractFirstJsonObject(input)).toBe(input);
  });

  it('returns null for an unbalanced object', () => {
    expect(extractFirstJsonObject('{"a":1')).toBeNull();
  });

  it('returns null when there is no object', () => {
    expect(extractFirstJsonObject('no json here')).toBeNull();
  });
});
