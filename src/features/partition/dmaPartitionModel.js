/**
 * DMA-oriented defaults for the common partition series builder.
 * Prefer importing from `src/components/common/partition/buildPartitionSeriesData.js` for new code.
 */

import {
  getPartitionData as getPartitionDataFromRows,
  leafLabel as leafLabelFromRows,
} from '../../components/common/partition/buildPartitionSeriesData.js';

export const DEFAULT_DMA_HIERARCHY = {
  grandparent: 'grandparent',
  parent: 'parent',
  leaf: 'dma',
  value: 'value',
};

export {
  buildDrilledPartitionData,
  buildOverviewPartitionData,
  normalizeRows,
  parseParentSlug,
  rowWeight,
  slugParent,
} from '../../components/common/partition/buildPartitionSeriesData.js';

/**
 * @param {Record<string, unknown>[]} rows
 * @param {string|null} drillParentName
 * @param {number|null} leafIndex
 * @param {import('../../components/common/partition/buildPartitionSeriesData.js').PartitionHierarchy} [hierarchy]
 */
export function getPartitionData(
  rows,
  drillParentName,
  leafIndex,
  hierarchy = DEFAULT_DMA_HIERARCHY
) {
  return getPartitionDataFromRows(rows, hierarchy, drillParentName, leafIndex);
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {string|null} drillParentName
 * @param {number|null} leafIndex
 * @param {import('../../components/common/partition/buildPartitionSeriesData.js').PartitionHierarchy} [hierarchy]
 */
export function leafLabel(
  rows,
  drillParentName,
  leafIndex,
  hierarchy = DEFAULT_DMA_HIERARCHY
) {
  return leafLabelFromRows(rows, hierarchy, drillParentName, leafIndex);
}
