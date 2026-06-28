import { describe, expect, it } from 'vitest';
import { imageId } from '@muse/shared/hash';
import type { CodexRunInput, CodexRunner, CodexRunResult } from './codex-runner.js';
import { createPropositionEngine, PropositionError } from './proposition.js';

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

const cleanVariants = JSON.stringify([
  {
    label: 'Ghibli',
    descriptor: 'soft painterly anime',
    query: 'ghibli landscape',
    previewUrl: 'https://x.com/g.jpg',
  },
  { label: 'Y2K', descriptor: 'glossy y2k tech', query: 'y2k aesthetic' },
]);

describe('createPropositionEngine', () => {
  it('parses variants into options with previews', async () => {
    const { runner, calls } = fakeRunner([{ lastMessage: cleanVariants }]);
    const round = await createPropositionEngine({ runner }).propose({ brief: 'anime' });

    expect(calls).toHaveLength(1);
    expect(round.options).toHaveLength(2);
    expect(round.options[0]).toMatchObject({ label: 'Ghibli', descriptor: 'soft painterly anime' });
    expect(round.options[0]?.preview).toMatchObject({
      id: imageId('https://x.com/g.jpg'),
      url: 'https://x.com/g.jpg',
      source: 'codex:websearch',
    });
    expect(round.options[1]?.preview).toBeUndefined();
  });

  it('retries once with a stricter reminder when output is unparseable', async () => {
    const { runner, calls } = fakeRunner([
      { lastMessage: 'here are some styles' },
      { lastMessage: cleanVariants },
    ]);
    const round = await createPropositionEngine({ runner }).propose({ brief: 'anime' });

    expect(calls).toHaveLength(2);
    expect(calls[1]?.prompt).toContain('could not be parsed');
    expect(round.options).toHaveLength(2);
  });

  it('throws PropositionError with raw output when both attempts fail', async () => {
    const { runner } = fakeRunner([{ lastMessage: 'nope' }, { lastMessage: 'still nope' }]);
    await expect(
      createPropositionEngine({ runner }).propose({ brief: 'anime' }),
    ).rejects.toBeInstanceOf(PropositionError);
  });

  it('caches by brief + refinements (no second runner call)', async () => {
    const { runner, calls } = fakeRunner([{ lastMessage: cleanVariants }]);
    const engine = createPropositionEngine({ runner });
    await engine.propose({ brief: 'anime' });
    await engine.propose({ brief: 'anime' });
    expect(calls).toHaveLength(1);
  });

  it('re-runs for different refinements', async () => {
    const { runner, calls } = fakeRunner([{ lastMessage: cleanVariants }]);
    const engine = createPropositionEngine({ runner });
    await engine.propose({ brief: 'anime' });
    await engine.propose({ brief: 'anime', refinements: ['retro'] });
    expect(calls).toHaveLength(2);
  });

  it('recovers variants from a prose preamble with stray brackets', async () => {
    const message = `Here are some directions [see refs]:\n\n\`\`\`json\n${cleanVariants}\n\`\`\``;
    const { runner, calls } = fakeRunner([{ lastMessage: message }]);
    const round = await createPropositionEngine({ runner }).propose({ brief: 'anime' });
    expect(round.options).toHaveLength(2);
    expect(calls).toHaveLength(1);
  });
});
