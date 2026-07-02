import { expect, test, type Route } from '@playwright/test';

// A 1x1 transparent PNG — served for image thumbnails so tldraw assets load cleanly.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMEAYEZkS0b' +
    'AAAAAElFTkSuQmCC',
  'base64',
);

const round = {
  id: 'round-1',
  brief: 'anime aesthetic',
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
  ],
};

const candidates = [
  { id: 'a', source: 'codex:websearch', url: 'https://x.com/a.jpg', rationale: 'fits the brief' },
];

const analysis = {
  palette: [{ hex: '#112233', role: 'dominant' }],
  typography: { style: 'serif', notes: 'classic' },
  spacing: { density: 'balanced', notes: 'even' },
  mood: ['warm'],
  motifs: ['arches'],
  summary: 'A warm classical board.',
};

function json(route: Route, body: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/clarify'))
      return json(route, { questions: [{ id: 'q1', question: 'What overall mood?' }] });
    if (url.includes('/api/propose')) return json(route, round);
    if (url.includes('/api/discover/stream')) {
      const body =
        `event: activity\ndata: ${JSON.stringify({ kind: 'search', query: 'cozy reading nook' })}\n\n` +
        `event: result\ndata: ${JSON.stringify(candidates)}\n\n`;
      return route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    }
    if (url.includes('/api/discover')) return json(route, candidates);
    if (url.includes('/api/synthesize')) return json(route, analysis);
    if (url.includes('/api/board')) {
      if (route.request().method() === 'POST') return route.fulfill({ status: 204, body: '' });
      return json(route, { elements: [], viewport: { x: 0, y: 0, zoom: 1 } });
    }
    if (url.includes('/thumbnail')) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1x1 });
    }
    if (url.includes('/api/export')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/zip',
        body: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      });
    }
    return route.fulfill({ status: 404, body: '' });
  });
});

test('propose → refine → discover → curate → export', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Muse' })).toBeVisible();

  // Brief → clarifying questions → proposition round
  await page.getByLabel('Project brief').fill('anime aesthetic');
  await page.getByRole('button', { name: /explore styles/i }).click();
  await expect(page.getByText('What overall mood?')).toBeVisible();
  await page.getByRole('button', { name: /^skip$/i }).click();
  await expect(page.getByText('Ghibli')).toBeVisible();

  // Pick a sub-style → refinement breadcrumb
  await page.getByRole('button', { name: 'Choose Ghibli' }).click();
  await expect(
    page.getByRole('navigation', { name: 'Chosen refinements' }).getByText('soft painterly anime'),
  ).toBeVisible();

  // Search now → discovery candidates
  await page.getByRole('button', { name: /search now/i }).click();
  await expect(page.getByText('fits the brief')).toBeVisible();

  // Wait for the whiteboard to mount, then add the candidate to the board
  await page.locator('.tl-container').waitFor({ state: 'visible' });
  await page.getByRole('button', { name: /to board/i }).click();

  // Export → the bundle downloads and the success status appears
  await page.getByRole('button', { name: 'Export bundle' }).click();
  await expect(page.getByRole('status')).toHaveText('Bundle downloaded.', { timeout: 15_000 });
});
