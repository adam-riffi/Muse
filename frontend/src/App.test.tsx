import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { server } from './test/msw/server';
import { useCandidateStore } from './state/candidates';

beforeEach(() => {
  useCandidateStore.getState().reset();
});

describe('App', () => {
  it('renders the Muse heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Muse' })).toBeInTheDocument();
  });

  it('discovers and renders candidates from a brief', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Project brief'), 'cozy y2k bedroom');
    await user.click(screen.getByRole('button', { name: /discover/i }));

    expect(await screen.findByText('fits the brief')).toBeInTheDocument();
  });

  it('shows an error message when discovery fails', async () => {
    server.use(http.post('/api/discover', () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Project brief'), 'x');
    await user.click(screen.getByRole('button', { name: /discover/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
