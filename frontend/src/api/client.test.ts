import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { clarify, discover, exportBundle, propose, searchImages, synthesize } from './client';
import { thumbnailUrl } from './urls';
import { server } from '../test/msw/server';

describe('api client', () => {
  it('discover() returns parsed candidates from the backend', async () => {
    const candidates = await discover({ brief: 'cozy y2k bedroom' });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ url: 'https://x.com/a.jpg', source: 'codex:websearch' });
  });

  it('propose() returns a proposition round', async () => {
    const round = await propose({ brief: 'anime' });
    expect(round.id).toBe('round-1');
    expect(round.options.length).toBeGreaterThan(0);
  });

  it('clarify() returns intake questions', async () => {
    const result = await clarify('a coffee brand');
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions[0]).toMatchObject({ id: 'q1' });
  });

  it('thumbnailUrl() builds the thumbnail endpoint path', () => {
    expect(thumbnailUrl('abc')).toBe('/api/image/abc/thumbnail');
  });

  it('searchImages() returns candidates from the image source', async () => {
    const candidates = await searchImages('anime', 5);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ url: 'https://x.com/a.jpg' });
  });

  it('synthesize() returns a MoodboardAnalysis', async () => {
    const analysis = await synthesize(['a']);
    expect(analysis.summary).toBe('A warm classical board.');
    expect(analysis.palette[0]).toMatchObject({ role: 'dominant' });
  });

  it('synthesize() surfaces the backend error message on failure', async () => {
    server.use(
      http.post('/api/synthesize', () =>
        HttpResponse.json(
          { error: 'Synthesis Failed', message: 'Vision model unavailable: quota exceeded' },
          { status: 502 },
        ),
      ),
    );
    await expect(synthesize(['a'])).rejects.toThrow('Vision model unavailable: quota exceeded');
  });

  it('exportBundle() returns a zip blob', async () => {
    const analysis = await synthesize(['a']);
    const blob = await exportBundle({ imageIds: ['a'], analysis });
    expect(blob.type).toContain('application/zip');
  });

  it('exportBundle() surfaces the backend error message on failure', async () => {
    const analysis = await synthesize(['a']);
    server.use(
      http.post('/api/export', () =>
        HttpResponse.json(
          { error: 'Export Failed', message: 'Board snapshot too large' },
          { status: 413 },
        ),
      ),
    );
    await expect(exportBundle({ imageIds: ['a'], analysis })).rejects.toThrow(
      'Board snapshot too large',
    );
  });
});
