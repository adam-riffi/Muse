import { describe, expect, it } from 'vitest';
import type { CodexRunInput, CodexRunner, CodexRunResult } from './codex-runner.js';
import { ClarifyError, createClarifier } from './clarify.js';

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

const questionsJson = JSON.stringify({
  questions: [
    { id: 'q1', question: 'What overall mood?', hint: 'calm, energetic…' },
    { id: 'q2', question: 'Which era or movement?' },
  ],
});

describe('createClarifier', () => {
  it('parses a clean questions object', async () => {
    const { runner, calls } = fakeRunner([{ lastMessage: questionsJson }]);
    const result = await createClarifier({ runner }).clarify({ brief: 'a coffee brand' });
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0]).toMatchObject({ id: 'q1', question: 'What overall mood?' });
    expect(calls).toHaveLength(1);
  });

  it('recovers questions from a prose preamble + fence and synthesizes missing ids', async () => {
    const message =
      'Sure! Here you go:\n\n```json\n[{"question":"Mood?"},{"question":"Era?"}]\n```';
    const { runner } = fakeRunner([{ lastMessage: message }]);
    const result = await createClarifier({ runner }).clarify({ brief: 'x' });
    expect(result.questions.map((q) => q.id)).toEqual(['q1', 'q2']);
  });

  it('caps the number of questions', async () => {
    const many = JSON.stringify({
      questions: Array.from({ length: 8 }, (_, i) => ({ id: `q${i}`, question: `Q${i}?` })),
    });
    const { runner } = fakeRunner([{ lastMessage: many }]);
    const result = await createClarifier({ runner }).clarify({ brief: 'x', count: 3 });
    expect(result.questions).toHaveLength(3);
  });

  it('treats an empty questions array as valid (no questions needed)', async () => {
    const { runner, calls } = fakeRunner([{ lastMessage: '{"questions":[]}' }]);
    const result = await createClarifier({ runner }).clarify({ brief: 'very specific brief' });
    expect(result.questions).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it('retries once on unparseable output then succeeds', async () => {
    const { runner, calls } = fakeRunner([
      { lastMessage: 'no json here' },
      { lastMessage: questionsJson },
    ]);
    const result = await createClarifier({ runner }).clarify({ brief: 'x' });
    expect(result.questions.length).toBeGreaterThan(0);
    expect(calls).toHaveLength(2);
  });

  it('fails fast with a timeout message and no retry', async () => {
    const { runner, calls } = fakeRunner([
      { lastMessage: null, stdout: 'partial', timedOut: true },
    ]);
    await expect(createClarifier({ runner }).clarify({ brief: 'x' })).rejects.toMatchObject({
      name: 'ClarifyError',
      message: expect.stringContaining('timed out'),
    });
    expect(calls).toHaveLength(1);
  });

  it('throws ClarifyError when both attempts are unparseable', async () => {
    const { runner } = fakeRunner([{ lastMessage: 'nope' }, { lastMessage: 'still nope' }]);
    await expect(createClarifier({ runner }).clarify({ brief: 'x' })).rejects.toBeInstanceOf(
      ClarifyError,
    );
  });
});
