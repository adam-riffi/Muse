import { http, HttpResponse } from 'msw';
import type { ImageCandidate, PropositionRound } from '@muse/shared';

const sampleCandidates: ImageCandidate[] = [
  { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits the brief' },
];

const sampleRound: PropositionRound = {
  id: 'round-1',
  brief: 'anime',
  refinements: [],
  options: [
    {
      id: 'ghibli',
      label: 'Ghibli',
      descriptor: 'soft painterly anime',
      query: 'ghibli landscape',
      preview: {
        id: 'prev-ghibli',
        source: 'codex:websearch',
        url: 'https://x.com/g.jpg',
        rationale: 'soft painterly anime',
      },
    },
    {
      id: 'y2k',
      label: 'Y2K',
      descriptor: 'glossy y2k tech',
      query: 'y2k aesthetic',
    },
  ],
};

export const handlers = [
  http.post('/api/discover', () => HttpResponse.json(sampleCandidates)),
  http.post('/api/propose', () => HttpResponse.json(sampleRound)),
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
];
