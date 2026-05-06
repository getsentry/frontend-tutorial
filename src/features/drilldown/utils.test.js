import { describe, expect, it } from 'vitest';
import {
  buildFiltersFromPath,
  buildGroupedTableSegments,
  buildSelectionsFromPath,
  collectTableColumnKeys,
  getItemLabel,
  getItemMetric,
  normalizeCardsResponse,
  normalizeLevels,
  normalizeTableResponse,
  stableSerialize,
  stableSortObject,
} from './utils.js';

const levels = [
  { id: 'L1', label: 'Channel', variables: ['channel', 'media_type'] },
  { id: 'L2', label: 'Campaign', variables: ['campaign_id'] },
];

describe('grouped table helpers', () => {
  it('buildGroupedTableSegments interleaves group headers and rows', () => {
    const lv = [
      { id: 'L1', label: 'Channel', variables: ['channel'] },
      { id: 'L2', label: 'Campaign', variables: ['campaign_id'] },
    ];
    const rows = [
      { channel: 'TV', campaign_id: 'C1', n: 1 },
      { channel: 'TV', campaign_id: 'C2', n: 2 },
    ];
    const segs = buildGroupedTableSegments(rows, lv);
    expect(segs.filter((s) => s.kind === 'group').length).toBeGreaterThan(0);
    expect(segs.filter((s) => s.kind === 'row').length).toBe(2);
  });
});

describe('filter construction and cache key serialization', () => {
  it('maps a selected value to all level variables', () => {
    const path = [{ levelId: 'L1', value: 'TV' }];
    const filters = buildFiltersFromPath({ levels, path, upToLevelIndex: 0 });

    expect(filters).toEqual({ channel: 'TV', media_type: 'TV' });
    expect(buildSelectionsFromPath(path)).toEqual({ L1: 'TV' });
  });

  it('serializes logical equivalents to the same cache signature', () => {
    const first = stableSerialize({ b: 2, a: 1 });
    const second = stableSerialize({ a: 1, b: 2 });

    expect(first).toBe(second);
  });

  it('matches RTK Query cache key shape for equivalent filter objects', () => {
    const serialize = (endpointName, queryArgs) =>
      `${endpointName}|${queryArgs.levelId}|${stableSerialize(queryArgs.filters ?? {})}`;
    expect(
      serialize('getCards', {
        levelId: 'L1',
        filters: { channel: 'TV', media_type: 'TV' },
      })
    ).toBe(
      serialize('getCards', {
        levelId: 'L1',
        filters: { media_type: 'TV', channel: 'TV' },
      })
    );
  });

  it('collects sorted union of keys for dynamic table columns', () => {
    expect(collectTableColumnKeys([{ a: 1 }, { b: 2, a: 3 }])).toEqual(['a', 'b']);
    expect(collectTableColumnKeys([])).toEqual([]);
  });

  it('covers utility normalization and fallback helpers', () => {
    expect(normalizeLevels(null)).toEqual([]);
    expect(
      normalizeLevels([
        { id: 'L1', variables: ['v1'], label: 'Level 1' },
        { id: 'L2', variables: ['v2'] },
        {},
      ])
    ).toEqual([
      { id: 'L1', label: 'Level 1', variables: ['v1'] },
      { id: 'L2', label: 'L2', variables: ['v2'] },
    ]);

    expect(stableSortObject({ z: { b: 2, a: 1 }, a: [2, 1] })).toEqual({
      a: [2, 1],
      z: { a: 1, b: 2 },
    });

    expect(normalizeCardsResponse([{ label: 'A' }])).toEqual([{ label: 'A' }]);
    expect(normalizeCardsResponse({ items: [{ label: 'A' }] })).toEqual([{ label: 'A' }]);
    expect(normalizeCardsResponse({ data: [{ label: 'A' }] })).toEqual([{ label: 'A' }]);
    expect(normalizeCardsResponse({})).toEqual([]);

    expect(normalizeTableResponse([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(normalizeTableResponse({ rows: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(normalizeTableResponse({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
    expect(normalizeTableResponse({})).toEqual([]);

    expect(getItemLabel({ label: 'x' })).toBe('x');
    expect(getItemLabel({ name: 'x' })).toBe('x');
    expect(getItemLabel({ title: 'x' })).toBe('x');
    expect(getItemLabel({ value: 'x' })).toBe('x');
    expect(getItemLabel({ id: 'x' })).toBe('x');
    expect(getItemLabel({})).toBe('Unknown');

    expect(getItemMetric({ metric: 9 })).toBe(9);
    expect(getItemMetric({ count: 9 })).toBe(9);
    expect(getItemMetric({ valueMetric: 9 })).toBe(9);
    expect(getItemMetric({})).toBeNull();
  });
});
