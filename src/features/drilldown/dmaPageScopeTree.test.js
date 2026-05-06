import { describe, expect, it } from 'vitest';
import { buildDmaRegionTree, getAllDmaKeys } from './dmaPageScopeTree.js';

describe('dmaPageScopeTree', () => {
  it('groups DMAs by parent region', () => {
    const tree = buildDmaRegionTree();
    const north = tree.find((r) => r.regionLabel === 'North region');
    expect(north).toBeDefined();
    expect(north.dmas.some((d) => d.dma === 'Boston')).toBe(true);
  });

  it('lists unique DMA keys', () => {
    const keys = getAllDmaKeys();
    expect(keys.length).toBe(new Set(keys).size);
    expect(keys).toContain('Boston');
  });
});
