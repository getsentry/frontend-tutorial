import { createSlice } from '@reduxjs/toolkit';
import { buildSelectionsFromPath, normalizeLevels, stableSerialize } from './utils.js';

const initialState = {
  levels: [],
  currentLevelIndex: 0,
  selections: {},
  path: [],
  /** Server-side dataset identity + page-level DMA scope; drives RTK cache + partition rows. */
  globalDatasetFilters: { scope: 'default', selectedDmas: null },
  status: 'idle',
};

const deriveStateFromPath = (state) => {
  state.selections = buildSelectionsFromPath(state.path);
};

const drilldownSlice = createSlice({
  name: 'drilldown',
  initialState,
  reducers: {
    /** Full reset: new config replaces drill order (levels are interchangeable by reordering). */
    setLevels(state, action) {
      state.levels = normalizeLevels(action.payload);
      state.currentLevelIndex = 0;
      state.path = [];
      state.selections = {};
      state.globalDatasetFilters = { scope: 'default', selectedDmas: null };
      state.status = state.levels.length ? 'ready' : 'idle';
    },
    /** Card click: record path, advance to next level’s cards (not table). Last level → end. */
    selectCard(state, action) {
      const { levelId, value } = action.payload;
      const currentLevel = state.levels[state.currentLevelIndex];

      if (!currentLevel || currentLevel.id !== levelId) {
        return;
      }

      const nextPath = state.path.slice(0, state.currentLevelIndex);
      nextPath.push({ levelId, value });
      state.path = nextPath;

      const hasNextLevel = state.currentLevelIndex < state.levels.length - 1;
      if (hasNextLevel) {
        state.currentLevelIndex += 1;
        state.status = 'ready';
      } else {
        state.status = 'end';
      }

      deriveStateFromPath(state);
    },
    stepBack(state) {
      const nextIndex = Math.max(state.currentLevelIndex - 1, 0);
      state.currentLevelIndex = nextIndex;
      state.path = state.path.slice(0, nextIndex);
      state.status = state.levels.length ? 'ready' : 'idle';
      deriveStateFromPath(state);
    },
    jumpToLevel(state, action) {
      const requestedLevel = action.payload;
      const boundedLevel = Math.max(
        0,
        Math.min(requestedLevel, Math.max(state.levels.length - 1, 0))
      );

      state.currentLevelIndex = boundedLevel;
      state.path = state.path.slice(0, boundedLevel);
      state.status = state.levels.length ? 'ready' : 'idle';
      deriveStateFromPath(state);
    },
    setStatus(state, action) {
      state.status = action.payload;
    },
    /**
     * When the serialized dataset identity changes, reset drill to the start level and clear path
     * so the chart/cards/table stay coherent with the new rows.
     */
    setGlobalDatasetFilters(state, action) {
      const patch =
        action.payload &&
        typeof action.payload === 'object' &&
        !Array.isArray(action.payload)
          ? action.payload
          : {};
      const next = {
        ...state.globalDatasetFilters,
        ...patch,
      };

      const prevSig = stableSerialize(state.globalDatasetFilters);
      const nextSig = stableSerialize(next);
      state.globalDatasetFilters = next;

      if (prevSig === nextSig || !state.levels.length) {
        return;
      }

      state.currentLevelIndex = 0;
      state.path = [];
      state.status = 'ready';
      deriveStateFromPath(state);
    },
  },
});

export const {
  setLevels,
  selectCard,
  stepBack,
  jumpToLevel,
  setStatus,
  setGlobalDatasetFilters,
} = drilldownSlice.actions;

export default drilldownSlice.reducer;
