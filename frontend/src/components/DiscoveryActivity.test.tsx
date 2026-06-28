import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DiscoveryActivity } from './DiscoveryActivity';
import { useCandidateStore } from '../state/candidates';

beforeEach(() => {
  useCandidateStore.getState().reset();
});

describe('DiscoveryActivity', () => {
  it('renders nothing when discovery is not running', () => {
    const { container } = render(<DiscoveryActivity />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows live reasoning and search activity while loading', () => {
    useCandidateStore.setState({
      status: 'loading',
      events: [
        { kind: 'reasoning', text: 'pondering the vibe' },
        { kind: 'search', query: 'cozy reading nook' },
      ],
    });
    render(<DiscoveryActivity />);
    expect(screen.getByLabelText('Discovery activity')).toBeInTheDocument();
    expect(screen.getByText('pondering the vibe')).toBeInTheDocument();
    expect(screen.getByText('cozy reading nook')).toBeInTheDocument();
  });
});
