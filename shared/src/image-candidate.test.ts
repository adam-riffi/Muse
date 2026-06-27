import { describe, expect, it } from 'vitest';
import { ImageCandidateSchema, ImageSource } from './image-candidate.js';

const valid = {
  id: 'abc123',
  source: ImageSource.CodexWebsearch,
  url: 'https://example.com/a.jpg',
  rationale: 'Matches the moody, low-key lighting in the brief.',
};

describe('ImageCandidateSchema', () => {
  it('accepts a minimal valid candidate', () => {
    expect(ImageCandidateSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional pageUrl and title', () => {
    const result = ImageCandidateSchema.safeParse({
      ...valid,
      pageUrl: 'https://example.com/post',
      title: 'Reference shot',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing url', () => {
    const result = ImageCandidateSchema.safeParse({
      id: 'abc123',
      source: ImageSource.CodexWebsearch,
      rationale: 'no url here',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-url url', () => {
    expect(ImageCandidateSchema.safeParse({ ...valid, url: 'not-a-url' }).success).toBe(false);
  });

  it('rejects a missing rationale', () => {
    const result = ImageCandidateSchema.safeParse({
      id: 'abc123',
      source: ImageSource.CodexWebsearch,
      url: 'https://example.com/a.jpg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-string id', () => {
    expect(ImageCandidateSchema.safeParse({ ...valid, id: 123 }).success).toBe(false);
  });
});
