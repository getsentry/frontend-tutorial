import { jumpToLevel, selectCard } from './drilldownSlice.js';

/**
 * Two-level icicle ↔ Redux bridge for the DMA mock: maps chart drill state to `selectCard` / `jumpToLevel`.
 * Row shape still expects partition fields `parent` and `dma` (see sample data); only **level ids** are taken
 * from config so renames in `dmaDrilldownLevels` do not break path matching.
 */

/** Default level ids for tests and the bundled `DMA_DRILL_LEVELS` mock. */
export const DMA_ICICLE_DEFAULT_LEVEL_IDS = {
  parentLevelId: 'region',
  leafLevelId: 'dma',
};

/**
 * @param {{ levelId: string; value: unknown }[] | undefined} path
 * @param {Record<string, unknown>[]} rows
 * @param {{ parentLevelId: string; leafLevelId: string }} [levelIds]
 */
export function pathToIcicleDrillState(
  path,
  rows,
  levelIds = DMA_ICICLE_DEFAULT_LEVEL_IDS
) {
  const { parentLevelId, leafLevelId } = levelIds;
  const parentStep = path.find((p) => p.levelId === parentLevelId);
  const leafStep = path.find((p) => p.levelId === leafLevelId);
  if (!parentStep) {
    return { parentValue: null, leafIndex: null };
  }
  const slice = rows.filter((row) => row.parent === parentStep.value);
  if (!leafStep) {
    return { parentValue: parentStep.value, leafIndex: null };
  }
  const idx = slice.findIndex((row) => row.dma === leafStep.value);
  return {
    parentValue: parentStep.value,
    leafIndex: idx >= 0 ? idx : null,
  };
}

/**
 * @param {{ levelId: string; value: unknown }[] | undefined} currentPath
 * @param {{ parentLevelId: string; leafLevelId: string }} [levelIds]
 */
export function applyIcicleDrillStateToRedux(
  dispatch,
  rows,
  next,
  currentPath,
  levelIds = DMA_ICICLE_DEFAULT_LEVEL_IDS
) {
  const { parentLevelId, leafLevelId } = levelIds;
  const { parentValue, leafIndex } = next;

  if (parentValue == null && (leafIndex == null || leafIndex === undefined)) {
    dispatch(jumpToLevel(0));
    return;
  }

  const parentStep = currentPath.find((p) => p.levelId === parentLevelId);
  const leafStep = currentPath.find((p) => p.levelId === leafLevelId);

  if (parentValue != null && (leafIndex == null || leafIndex === undefined)) {
    if (parentStep && leafStep && parentStep.value === parentValue && leafStep.value) {
      dispatch(jumpToLevel(1));
      return;
    }
    dispatch(jumpToLevel(0));
    dispatch(selectCard({ levelId: parentLevelId, value: parentValue }));
    return;
  }

  const slice = rows.filter((r) => r.parent === parentValue);
  const dma = slice[leafIndex]?.dma;
  if (!dma) {
    return;
  }
  dispatch(jumpToLevel(0));
  dispatch(selectCard({ levelId: parentLevelId, value: parentValue }));
  dispatch(selectCard({ levelId: leafLevelId, value: dma }));
}
