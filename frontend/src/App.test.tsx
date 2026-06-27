import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { server } from './test/msw/server';
import { useCandidateStore } from './state/candidates';
import { usePropositionStore } from './state/propositions';

vi.mock('tldraw', () => ({ Tldraw: () => null }));

beforeEach(() => {
  useCandidateStore.getState().reset();
  usePropositionStore.getState().reset();
});

describe('App', () => {
  it('renders the Muse heading and the whiteboard region', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Muse' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Whiteboard' })).toBeInTheDocument();
  });

  it('runs the propose → refine → search flow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Brief → proposition round
    await user.type(screen.getByLabelText('Project brief'), 'anime aesthetic');
    await user.click(screen.getByRole('button', { name: /explore styles/i }));
    expect(await screen.findByText('Ghibli')).toBeInTheDocument();

    // Pick a sub-style → descriptor appears in the refinement breadcrumb
    await user.click(screen.getByRole('button', { name: 'Choose Ghibli' }));
    const breadcrumb = await screen.findByRole('navigation', { name: 'Chosen refinements' });
    expect(within(breadcrumb).getByText('soft painterly anime')).toBeInTheDocument();

    // Search now → discovery candidates render
    await user.click(screen.getByRole('button', { name: /search now/i }));
    expect(await screen.findByText('fits the brief')).toBeInTheDocument();

    // The candidate appears in the tray with an "add to board" action
    expect(screen.getByRole('button', { name: /to board/i })).toBeInTheDocument();
  });

  it('shows an error when propositions fail', async () => {
    server.use(http.post('/api/propose', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Project brief'), 'x');
    await user.click(screen.getByRole('button', { name: /explore styles/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
