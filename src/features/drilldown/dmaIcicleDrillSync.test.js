import { describe, expect, it, vi } from 'vitest';

import { jumpToLevel, selectCard } from './drilldownSlice.js';
import {
  applyIcicleDrillStateToRedux,
  DMA_ICICLE_DEFAULT_LEVEL_IDS,
  pathToIcicleDrillState,
} from './dmaIcicleDrillSync.js';

const rows = [
  { dma: 'A', parent: 'R1', grandparent: 'T', value: 1 },
  { dma: 'B', parent: 'R1', grandparent: 'T', value: 1 },
];

describe('pathToIcicleDrillState', () => {
  it('returns empty drill when no region in path', () => {
    expect(pathToIcicleDrillState([], rows)).toEqual({
      parentValue: null,
      leafIndex: null,
    });
  });

  it('maps region-only path', () => {
    expect(pathToIcicleDrillState([{ levelId: 'region', value: 'R1' }], rows)).toEqual({
      parentValue: 'R1',
      leafIndex: null,
    });
  });

  it('maps region + dma to leaf index', () => {
    expect(
      pathToIcicleDrillState(
        [
          { levelId: 'region', value: 'R1' },
          { levelId: 'dma', value: 'B' },
        ],
        rows
      )
    ).toEqual({ parentValue: 'R1', leafIndex: 1 });
  });

  it('uses configured level ids instead of hardcoded region/dma', () => {
    const ids = { parentLevelId: 'L1', leafLevelId: 'L2' };
    expect(
      pathToIcicleDrillState(
        [
          { levelId: 'L1', value: 'R1' },
          { levelId: 'L2', value: 'B' },
        ],
        rows,
        ids
      )
    ).toEqual({ parentValue: 'R1', leafIndex: 1 });
    expect(pathToIcicleDrillState([{ levelId: 'L1', value: 'R1' }], rows, ids)).toEqual({
      parentValue: 'R1',
      leafIndex: null,
    });
  });

  it('defaults to DMA_ICICLE_DEFAULT_LEVEL_IDS', () => {
    expect(DMA_ICICLE_DEFAULT_LEVEL_IDS).toEqual({
      parentLevelId: 'region',
      leafLevelId: 'dma',
    });
  });
});

describe('applyIcicleDrillStateToRedux', () => {
  it('clears path on empty drill state', () => {
    const dispatch = vi.fn();
    applyIcicleDrillStateToRedux(
      dispatch,
      rows,
      { parentValue: null, leafIndex: null },
      []
    );
    expect(dispatch).toHaveBeenCalledWith(jumpToLevel(0));
  });

  it('selects region from overview', () => {
    const dispatch = vi.fn();
    applyIcicleDrillStateToRedux(
      dispatch,
      rows,
      { parentValue: 'R1', leafIndex: null },
      []
    );
    expect(dispatch).toHaveBeenCalledWith(jumpToLevel(0));
    expect(dispatch).toHaveBeenCalledWith(selectCard({ levelId: 'region', value: 'R1' }));
  });

  it('jumps to parent breakdown when backing from dma', () => {
    const dispatch = vi.fn();
    const path = [
      { levelId: 'region', value: 'R1' },
      { levelId: 'dma', value: 'B' },
    ];
    applyIcicleDrillStateToRedux(
      dispatch,
      rows,
      { parentValue: 'R1', leafIndex: null },
      path
    );
    expect(dispatch).toHaveBeenCalledWith(jumpToLevel(1));
  });

  it('selects dma leaf', () => {
    const dispatch = vi.fn();
    applyIcicleDrillStateToRedux(dispatch, rows, { parentValue: 'R1', leafIndex: 1 }, [
      { levelId: 'region', value: 'R1' },
    ]);
    expect(dispatch).toHaveBeenCalledWith(jumpToLevel(0));
    expect(dispatch).toHaveBeenCalledWith(selectCard({ levelId: 'region', value: 'R1' }));
    expect(dispatch).toHaveBeenCalledWith(selectCard({ levelId: 'dma', value: 'B' }));
  });

  it('dispatches selectCard with custom level ids', () => {
    const dispatch = vi.fn();
    const ids = { parentLevelId: 'L1', leafLevelId: 'L2' };
    applyIcicleDrillStateToRedux(
      dispatch,
      rows,
      { parentValue: 'R1', leafIndex: 1 },
      [{ levelId: 'L1', value: 'R1' }],
      ids
    );
    expect(dispatch).toHaveBeenCalledWith(selectCard({ levelId: 'L1', value: 'R1' }));
    expect(dispatch).toHaveBeenCalledWith(selectCard({ levelId: 'L2', value: 'B' }));
  });
});
