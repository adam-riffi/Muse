import { useState } from 'react';
import type { ImageCandidate } from '@muse/shared';
import { thumbnailUrl } from '../api/client';

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
}

// Renders a candidate's thumbnail through the backend proxy (which fetches server-side with a
// browser User-Agent, avoiding hotlink/referer blocks). If the image is genuinely unavailable
// (dead link, blocked, not an image), it falls back to a tidy placeholder instead of a broken icon.
export function CandidateImage({
  candidate,
  className,
}: {
  candidate: ImageCandidate;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${candidate.title ?? 'Image'} unavailable`}
        className={`flex flex-col items-center justify-center gap-1 bg-zinc-800 p-2 text-center text-zinc-500 ${className ?? ''}`}
      >
        <span aria-hidden className="text-lg">
          🖼️
        </span>
        <span className="text-[10px] leading-tight">image unavailable</span>
        <span className="max-w-full truncate text-[10px] text-zinc-600">
          {hostOf(candidate.url)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={thumbnailUrl(candidate.id)}
      alt={candidate.title ?? candidate.rationale}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
