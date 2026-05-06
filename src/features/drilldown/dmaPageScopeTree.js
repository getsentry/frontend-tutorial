import { SAMPLE_DMA_PARTITION_ROWS } from '../../mocks/dmaPartitionSampleData.js';

/**
 * Region → DMA list for page-scope multi-select (mock data shape).
 */
export function buildDmaRegionTree(rows = SAMPLE_DMA_PARTITION_ROWS) {
  const byParent = new Map();
  for (const row of rows) {
    const parent = String(row.parent ?? '—');
    if (!byParent.has(parent)) {
      byParent.set(parent, []);
    }
    byParent.get(parent).push({
      dma: String(row.dma),
      parent,
    });
  }
  const regions = [...byParent.entries()].map(([regionLabel, items]) => ({
    regionLabel,
    dmas: items.sort((a, b) => a.dma.localeCompare(b.dma)),
  }));
  regions.sort((a, b) => a.regionLabel.localeCompare(b.regionLabel));
  return regions;
}

export function getAllDmaKeys(rows = SAMPLE_DMA_PARTITION_ROWS) {
  return [...new Set(rows.map((r) => String(r.dma)))].sort((a, b) => a.localeCompare(b));
}
