import { describe, expect, it } from 'vitest';
import { discover } from './client';

describe('api client', () => {
  it('discover() returns parsed candidates from the backend', async () => {
    const candidates = await discover({ brief: 'cozy y2k bedroom' });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ url: 'https://x.com/a.jpg', source: 'codex:websearch' });
  });
});
