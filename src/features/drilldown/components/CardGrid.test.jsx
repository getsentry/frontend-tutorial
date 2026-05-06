import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CardGrid from './CardGrid.jsx';

describe('CardGrid', () => {
  it('renders label and optional metric and notifies on click', async () => {
    const user = userEvent.setup();
    const onCardClick = vi.fn();
    const items = [{ id: '1', label: 'TV', metric: 42 }];

    render(<CardGrid items={items} onCardClick={onCardClick} />);

    expect(screen.getByText('TV')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /TV/ }));
    expect(onCardClick).toHaveBeenCalledWith(items[0], 'TV');
  });
});
