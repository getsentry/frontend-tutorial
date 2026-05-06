import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DMA_DRILL_LEVELS } from '../../../mocks/dmaDrilldownLevels.js';
import DmaAggregateMetricsTable from './DmaAggregateMetricsTable.jsx';

describe('DmaAggregateMetricsTable', () => {
  it('renders nothing when levels are not the DMA drill config', () => {
    render(
      <DmaAggregateMetricsTable
        rows={[{ parent: 'A', dma: 'X' }]}
        path={[]}
        levels={[{ id: 'a', label: 'A', variables: ['x'] }]}
      />
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('marks the rollup row when only a region is selected', () => {
    const rows = [
      {
        id: 'rollup-North region',
        rowKind: 'rollup',
        parent: 'North region',
        dma: '—',
        share: 1,
        spend: 100,
      },
      {
        id: 'd1',
        rowKind: 'detail',
        parent: 'North region',
        dma: 'Boston',
        share: 0.5,
        spend: 50,
      },
    ];

    render(
      <DmaAggregateMetricsTable
        rows={rows}
        path={[{ levelId: 'region', value: 'North region' }]}
        levels={DMA_DRILL_LEVELS}
      />
    );

    expect(screen.getByRole('row', { selected: true })).toHaveTextContent('North region');
  });

  it('marks the DMA detail row when region and DMA are selected', () => {
    const rows = [
      {
        id: 'rollup-North region',
        rowKind: 'rollup',
        parent: 'North region',
        dma: '—',
        share: 1,
        spend: 100,
      },
      {
        id: 'd1',
        rowKind: 'detail',
        parent: 'North region',
        dma: 'Boston',
        share: 0.5,
        spend: 50,
      },
    ];

    render(
      <DmaAggregateMetricsTable
        rows={rows}
        path={[
          { levelId: 'region', value: 'North region' },
          { levelId: 'dma', value: 'Boston' },
        ]}
        levels={DMA_DRILL_LEVELS}
      />
    );

    expect(screen.getByRole('row', { selected: true })).toHaveTextContent('Boston');
  });
});
