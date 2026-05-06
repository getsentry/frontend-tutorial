import { describe, expect, it } from 'vitest';

import {
  buildOverviewPartitionData,
  getPartitionData,
  normalizeRows,
} from './buildPartitionSeriesData';

const ALT_HIERARCHY = {
  grandparent: 'geo',
  parent: 'market',
  leaf: 'sku',
  value: 'vol',
};

describe('normalizeRows', () => {
  it('maps arbitrary column names to internal shape', () => {
    const rows = [
      { geo: 'WW', market: 'A', sku: 'x', vol: 10 },
      { geo: 'WW', market: 'A', sku: 'y', vol: 10 },
    ];
    const n = normalizeRows(rows, ALT_HIERARCHY);
    expect(n).toHaveLength(2);
    expect(n[0]).toMatchObject({
      grandparent: 'WW',
      parent: 'A',
      leaf: 'x',
      value: 10,
    });
    expect(n[0].raw).toBe(rows[0]);
  });

  it('defaults missing grandparent to Total', () => {
    const rows = [{ market: 'A', sku: 'x', vol: 1 }];
    const n = normalizeRows(rows, ALT_HIERARCHY);
    expect(n[0].grandparent).toBe('Total');
  });
});

describe('getPartitionData', () => {
  it('builds overview with three rows of points', () => {
    const rows = [
      { geo: 'T', market: 'North', sku: 'B', vol: 60 },
      { geo: 'T', market: 'North', sku: 'C', vol: 40 },
      { geo: 'T', market: 'South', sku: 'D', vol: 100 },
    ];
    const data = getPartitionData(rows, ALT_HIERARCHY, null, null);
    const ys = [...new Set(data.map((d) => d.y))].sort();
    expect(ys).toEqual([0, 1, 2]);
    const top = data.filter((d) => d.y === 0);
    expect(top).toHaveLength(1);
    expect(top[0].name).toBe('T');
    expect(top[0].x).toBe(0);
    expect(top[0].x2).toBe(100);
  });

  it('drills to parent with normalized leaf row', () => {
    const rows = [
      { geo: 'T', market: 'North', sku: 'B', vol: 50 },
      { geo: 'T', market: 'North', sku: 'C', vol: 50 },
    ];
    const data = getPartitionData(rows, ALT_HIERARCHY, 'North', null);
    expect(data.some((d) => d.name === 'B' && d.y === 2)).toBe(true);
    expect(data.some((d) => d.name === 'C' && d.y === 2)).toBe(true);
  });
});

describe('buildOverviewPartitionData', () => {
  it('assigns non-zero width to each parent band from vol', () => {
    const rows = [
      { geo: 'T', market: 'P1', sku: 'a', vol: 25 },
      { geo: 'T', market: 'P2', sku: 'b', vol: 75 },
    ];
    const data = buildOverviewPartitionData(rows, ALT_HIERARCHY);
    const p1 = data.find((d) => d.y === 1 && d.name === 'P1');
    const p2 = data.find((d) => d.y === 1 && d.name === 'P2');
    expect(p1.x2 - p1.x).toBeCloseTo(25, 5);
    expect(p2.x2 - p2.x).toBeCloseTo(75, 5);
  });

  it('tags leaf strips with parent drillId for overview hover handoff', () => {
    const rows = [
      { geo: 'T', market: 'P1', sku: 'a', vol: 50 },
      { geo: 'T', market: 'P1', sku: 'b', vol: 50 },
    ];
    const data = buildOverviewPartitionData(rows, ALT_HIERARCHY);
    const leaves = data.filter((d) => d.y === 2);
    expect(leaves.length).toBe(2);
    expect(leaves[0].custom?.drillId).toBe('parent:P1');
    expect(leaves[1].custom?.drillId).toBe('parent:P1');
  });
});
