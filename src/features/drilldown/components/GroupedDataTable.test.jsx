import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import GroupedDataTable from './GroupedDataTable.jsx';

describe('GroupedDataTable', () => {
  it('renders group rows and data rows', () => {
    const levels = [
      { id: 'L1', label: 'Channel', variables: ['channel'] },
      { id: 'L2', label: 'Campaign', variables: ['campaign_id'] },
    ];
    const rows = [
      { id: '1', channel: 'TV', campaign_id: 'C1' },
      { id: '2', channel: 'TV', campaign_id: 'C2' },
    ];

    render(<GroupedDataTable rows={rows} levels={levels} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Channel')).toBeInTheDocument();
  });

  it('shows empty state when there are no rows', () => {
    render(<GroupedDataTable rows={[]} levels={[]} />);
    expect(screen.getByText('No table rows available.')).toBeInTheDocument();
  });
});
