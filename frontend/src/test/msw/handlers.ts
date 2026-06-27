import { http, HttpResponse } from 'msw';
import type { ImageCandidate } from '@muse/shared';

const sampleCandidates: ImageCandidate[] = [
  { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits the brief' },
];

export const handlers = [
  http.post('/api/discover', () => HttpResponse.json(sampleCandidates)),
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
];
