import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ImageCandidate } from '@muse/shared';
import { CandidateImage } from './CandidateImage';

const candidate: ImageCandidate = {
  id: 'abc',
  source: 'codex:websearch',
  url: 'https://images.example.com/a.jpg',
  title: 'A nook',
  rationale: 'fits',
};

describe('CandidateImage', () => {
  it('renders the proxied thumbnail with alt text', () => {
    render(<CandidateImage candidate={candidate} />);
    const img = screen.getByRole('img', { name: 'A nook' });
    expect(img).toHaveAttribute('src', '/api/image/abc/thumbnail');
  });

  it('falls back to a placeholder when the image fails to load', () => {
    render(<CandidateImage candidate={candidate} />);
    fireEvent.error(screen.getByRole('img', { name: 'A nook' }));
    expect(screen.getByRole('img', { name: 'A nook unavailable' })).toBeInTheDocument();
    expect(screen.getByText('images.example.com')).toBeInTheDocument();
  });
});
