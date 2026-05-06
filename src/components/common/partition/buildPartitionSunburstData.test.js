import { describe, expect, it } from 'vitest';

import { getSunburstPartitionData } from './buildPartitionSunburstData';

const ALT_HIERARCHY = {
  grandparent: 'geo',
  parent: 'market',
  leaf: 'sku',
  value: 'vol',
};

describe('getSunburstPartitionData overview', () => {
  it('builds a root node and hierarchical children', () => {
    const rows = [
      { geo: 'T', market: 'North', sku: 'A', vol: 50 },
      { geo: 'T', market: 'North', sku: 'B', vol: 50 },
    ];
    const data = getSunburstPartitionData(rows, ALT_HIERARCHY, null, null);
    const root = data.find((d) => d.id === 'root');
    expect(root?.value).toBe(100);
    expect(data.some((d) => d.parent === 'root' && d.name === 'T')).toBe(true);
    expect(data.filter((d) => d.parent && d.parent !== 'root').length).toBeGreaterThan(0);
  });
});

describe('getSunburstPartitionData', () => {
  it('matches drill semantics: parent drill exposes leaf nodes', () => {
    const rows = [
      { geo: 'T', market: 'North', sku: 'A', vol: 40 },
      { geo: 'T', market: 'North', sku: 'B', vol: 60 },
    ];
    const data = getSunburstPartitionData(rows, ALT_HIERARCHY, 'North', null);
    const leaves = data.filter((d) => d.custom?.level === 'leaf');
    expect(leaves).toHaveLength(2);
  });
});
