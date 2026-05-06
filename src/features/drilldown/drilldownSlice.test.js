import { describe, expect, it } from 'vitest';
import drilldownReducer, {
  jumpToLevel,
  selectCard,
  setGlobalDatasetFilters,
  setLevels,
  setStatus,
  stepBack,
} from './drilldownSlice.js';
import { buildFiltersFromPath } from './utils.js';
import { DMA_DRILL_LEVELS } from '../../mocks/dmaDrilldownLevels.js';

const levels = [
  { id: 'L1', label: 'Channel', variables: ['channel', 'media_type'] },
  { id: 'L2', label: 'Campaign', variables: ['campaign_id'] },
];

describe('drilldownSlice navigation and path', () => {
  it('resets state on config set and derives selections from path', () => {
    let state = drilldownReducer(undefined, setLevels(levels));

    state = drilldownReducer(state, selectCard({ levelId: 'L1', value: 'TV' }));

    expect(state.path).toEqual([{ levelId: 'L1', value: 'TV' }]);
    expect(state.selections).toEqual({ L1: 'TV' });
    expect(state.currentLevelIndex).toBe(1);
    expect(state.globalDatasetFilters.selectedDmas).toBeNull();
  });

  it('supports forward and back navigation without hardcoded levels', () => {
    let state = drilldownReducer(undefined, setLevels(levels));
    state = drilldownReducer(state, selectCard({ levelId: 'L1', value: 'TV' }));

    expect(state.currentLevelIndex).toBe(1);

    state = drilldownReducer(state, stepBack());
    expect(state.currentLevelIndex).toBe(0);
    expect(state.path).toEqual([]);

    state = drilldownReducer(state, jumpToLevel(1));
    expect(state.currentLevelIndex).toBe(1);
    expect(state.path).toEqual([]);
  });

  it('handles invalid level selections and last-level end state', () => {
    let state = drilldownReducer(undefined, setLevels(levels));
    state = drilldownReducer(state, selectCard({ levelId: 'WRONG', value: 'x' }));
    expect(state.path).toEqual([]);

    state = drilldownReducer(state, selectCard({ levelId: 'L1', value: 'TV' }));
    expect(state.currentLevelIndex).toBe(1);
    state = drilldownReducer(state, selectCard({ levelId: 'L2', value: 'C1' }));

    expect(state.status).toBe('end');
    expect(state.path).toEqual([
      { levelId: 'L1', value: 'TV' },
      { levelId: 'L2', value: 'C1' },
    ]);
  });

  it('bounds jumpToLevel and handles empty config', () => {
    let state = drilldownReducer(undefined, setLevels([]));
    expect(state.status).toBe('idle');

    state = drilldownReducer(state, jumpToLevel(4));
    expect(state.currentLevelIndex).toBe(0);

    state = drilldownReducer(state, setLevels(levels));
    state = drilldownReducer(state, jumpToLevel(99));
    expect(state.currentLevelIndex).toBe(1);
  });

  it('supports swapped level order (Campaign before Channel)', () => {
    const swappedLevels = [
      { id: 'L2', label: 'Campaign', variables: ['campaign_id'] },
      { id: 'L1', label: 'Channel', variables: ['channel', 'media_type'] },
    ];
    let state = drilldownReducer(undefined, setLevels(swappedLevels));
    state = drilldownReducer(state, selectCard({ levelId: 'L2', value: 'C1' }));

    expect(state.currentLevelIndex).toBe(1);
    expect(state.path).toEqual([{ levelId: 'L2', value: 'C1' }]);
    expect(
      buildFiltersFromPath({
        levels: swappedLevels,
        path: state.path,
        upToLevelIndex: 0,
      })
    ).toEqual({ campaign_id: 'C1' });
  });

  it('allows setting status directly', () => {
    let state = drilldownReducer(undefined, setLevels(levels));
    state = drilldownReducer(state, setStatus('loading'));
    expect(state.status).toBe('loading');
  });

  it('prefetch filters for next level match post-card path', () => {
    const pathAfterCard = [{ levelId: 'L1', value: 'TV' }];
    const prefetchFilters = buildFiltersFromPath({
      levels,
      path: pathAfterCard,
      upToLevelIndex: 0,
    });
    expect(prefetchFilters).toEqual({ channel: 'TV', media_type: 'TV' });

    let state = drilldownReducer(undefined, setLevels(levels));
    state = drilldownReducer(state, selectCard({ levelId: 'L1', value: 'TV' }));
    expect(
      buildFiltersFromPath({
        levels,
        path: state.path,
        upToLevelIndex: 0,
      })
    ).toEqual(prefetchFilters);
  });
});

describe('drilldownSlice global dataset', () => {
  it('resets drill path when global dataset identity changes', () => {
    let state = drilldownReducer(undefined, setLevels(DMA_DRILL_LEVELS));
    state = drilldownReducer(
      state,
      selectCard({ levelId: 'region', value: 'North region' })
    );
    expect(state.path).toHaveLength(1);

    state = drilldownReducer(state, setGlobalDatasetFilters({ scope: 'alternate' }));
    expect(state.path).toEqual([]);
    expect(state.currentLevelIndex).toBe(0);
  });

  it('does not reset when dataset payload serializes to the same identity', () => {
    let state = drilldownReducer(undefined, setLevels(DMA_DRILL_LEVELS));
    state = drilldownReducer(
      state,
      selectCard({ levelId: 'region', value: 'North region' })
    );
    const pathBefore = state.path;
    state = drilldownReducer(state, setGlobalDatasetFilters({ scope: 'default' }));
    expect(state.path).toEqual(pathBefore);
  });
});
