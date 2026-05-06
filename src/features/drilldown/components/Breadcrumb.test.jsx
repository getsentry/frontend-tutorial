import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Breadcrumb from './Breadcrumb.jsx';

describe('Breadcrumb', () => {
  it('renders path steps with labels from levels (order-agnostic ids)', () => {
    const levels = [
      { id: 'campaign', label: 'Campaign', variables: ['campaign_id'] },
      { id: 'channel', label: 'Channel', variables: ['channel'] },
    ];
    const path = [{ levelId: 'campaign', value: 'C1' }];

    render(<Breadcrumb levels={levels} path={path} onJump={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Campaign: C1/ })).toBeInTheDocument();
  });

  it('calls onJump with path index when a step is clicked', async () => {
    const user = userEvent.setup();
    const onJump = vi.fn();
    const levels = [{ id: 'L1', label: 'A', variables: ['a'] }];
    const path = [{ levelId: 'L1', value: 'x' }];

    render(<Breadcrumb levels={levels} path={path} onJump={onJump} />);

    await user.click(screen.getByRole('button', { name: /A: x/ }));
    expect(onJump).toHaveBeenCalledWith(0);
  });
});
