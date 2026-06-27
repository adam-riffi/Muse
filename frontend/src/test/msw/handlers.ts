import { http, HttpResponse } from 'msw';
import type { ImageCandidate, MoodboardAnalysis, PropositionRound } from '@muse/shared';

const sampleCandidates: ImageCandidate[] = [
  { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits the brief' },
];

const sampleAnalysis: MoodboardAnalysis = {
  palette: [{ hex: '#112233', role: 'dominant' }],
  typography: { style: 'serif', notes: 'classic' },
  spacing: { density: 'balanced', notes: 'even' },
  mood: ['warm'],
  motifs: ['arches'],
  summary: 'A warm classical board.',
};

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
  http.get('/api/images/search', () => HttpResponse.json(sampleCandidates)),
  http.post('/api/synthesize', () => HttpResponse.json(sampleAnalysis)),
  http.post(
    '/api/export',
    () =>
      new HttpResponse(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), {
        headers: { 'content-type': 'application/zip' },
      }),
  ),
  http.get('/api/board', () =>
    HttpResponse.json({ elements: [], viewport: { x: 0, y: 0, zoom: 1 } }),
  ),
  http.post('/api/board', () => new HttpResponse(null, { status: 204 })),
];
