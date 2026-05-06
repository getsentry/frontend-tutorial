import { createSelector } from '@reduxjs/toolkit';
import { buildFiltersFromPath } from './utils.js';

export const selectDrilldownState = (state) => state.drilldown;

export const selectLevels = createSelector(
  [selectDrilldownState],
  (drilldown) => drilldown.levels
);

export const selectCurrentLevelIndex = createSelector(
  [selectDrilldownState],
  (drilldown) => drilldown.currentLevelIndex
);

export const selectCurrentLevel = createSelector(
  [selectLevels, selectCurrentLevelIndex],
  (levels, index) => levels[index] ?? null
);

export const selectPath = createSelector(
  [selectDrilldownState],
  (drilldown) => drilldown.path
);

export const selectGlobalDatasetFilters = createSelector(
  [selectDrilldownState],
  (drilldown) =>
    drilldown.globalDatasetFilters ?? { scope: 'default', selectedDmas: null }
);

export const selectStatus = createSelector(
  [selectDrilldownState],
  (drilldown) => drilldown.status
);

/**
 * Variable→value map for RTK/API filters built from `path` steps at indices `0…endPathStepIndex` (inclusive).
 * Aligns with `buildFiltersFromPath({ upToLevelIndex: endPathStepIndex })`: use `-1` for an empty map.
 *
 * Typical uses:
 * - Cards for the current level: `endPathStepIndex = currentLevelIndex - 1` (filters from completed steps only).
 * - Prefetch for the next level’s cards: `endPathStepIndex = currentLevelIndex`.
 * - Table for full context: `endPathStepIndex = path.length - 1` (when `path.length > 0`).
 */
export const selectFiltersUpToPathStepInclusive = createSelector(
  [selectLevels, selectPath, (_state, endPathStepIndex) => endPathStepIndex],
  (levels, path, endPathStepIndex) =>
    buildFiltersFromPath({
      levels,
      path,
      upToLevelIndex: endPathStepIndex,
    })
);
