import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClarifyForm } from './ClarifyForm';
import { useClarifyStore } from '../state/clarify';

beforeEach(() => {
  useClarifyStore.getState().reset();
});

describe('ClarifyForm', () => {
  it('renders questions and submits the answers as refinements', async () => {
    useClarifyStore.setState({
      status: 'ready',
      brief: 'x',
      questions: [{ id: 'q1', question: 'What overall mood?' }],
    });
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClarifyForm onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox'), 'dreamy');
    await user.click(screen.getByRole('button', { name: /explore styles/i }));
    expect(onSubmit).toHaveBeenCalledWith(['dreamy']);
  });

  it('submits no refinements when skipped', async () => {
    useClarifyStore.setState({
      status: 'ready',
      questions: [{ id: 'q1', question: 'What mood?' }],
    });
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClarifyForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /skip/i }));
    expect(onSubmit).toHaveBeenCalledWith([]);
  });

  it('offers to continue when there are no questions', async () => {
    useClarifyStore.setState({ status: 'ready', questions: [] });
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClarifyForm onSubmit={onSubmit} />);

    expect(screen.getByText(/looks specific/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /explore styles/i }));
    expect(onSubmit).toHaveBeenCalledWith([]);
  });

  it('lets the user proceed after an error', async () => {
    useClarifyStore.setState({ status: 'error', error: 'boom', questions: [] });
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ClarifyForm onSubmit={onSubmit} />);

    expect(screen.getByRole('alert')).toHaveTextContent('boom');
    await user.click(screen.getByRole('button', { name: /anyway/i }));
    expect(onSubmit).toHaveBeenCalledWith([]);
  });
});
