import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { stableSerialize } from '../features/drilldown/utils.js';
import { drilldownApi } from './drilldownApi.js';

const makeStore = () =>
  configureStore({
    reducer: { [drilldownApi.reducerPath]: drilldownApi.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(drilldownApi.middleware),
  });

describe('drilldownApi', () => {
  it('returns card data via mock engine by default', async () => {
    const store = makeStore();
    const result = await store.dispatch(
      drilldownApi.endpoints.getCards.initiate({
        levelId: 'region',
        filters: {},
      })
    );
    if ('data' in result) {
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    } else {
      expect.fail('expected fulfilled result');
    }
  });

  it('returns table data via mock engine by default', async () => {
    const store = makeStore();
    const result = await store.dispatch(
      drilldownApi.endpoints.getTable.initiate({
        levelId: 'dma',
        filters: {},
      })
    );
    if ('data' in result) {
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    } else {
      expect.fail('expected fulfilled result');
    }
  });

  it('returns DMA aggregate metrics via mock engine by default', async () => {
    const store = makeStore();
    const result = await store.dispatch(
      drilldownApi.endpoints.getDmaAggregateTable.initiate({
        dataset: { scope: 'default' },
      })
    );
    if ('data' in result) {
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.some((row) => row.rowKind === 'rollup')).toBe(true);
      expect(result.data.some((row) => row.rowKind === 'detail')).toBe(true);
    } else {
      expect.fail('expected fulfilled result');
    }
  });

  it('uses stable filter serialization in cache keys', () => {
    const serialize = (endpointName, queryArgs) =>
      `${endpointName}|${queryArgs.levelId}|${stableSerialize(queryArgs.filters ?? {})}|${stableSerialize(queryArgs.dataset ?? {})}`;
    const a = serialize('getCards', {
      levelId: 'L1',
      filters: { b: 2, a: 1 },
      dataset: {},
    });
    const b = serialize('getCards', {
      levelId: 'L1',
      filters: { a: 1, b: 2 },
      dataset: {},
    });
    expect(a).toBe(b);
  });

  it('returns partition rows via mock engine by default', async () => {
    const store = makeStore();
    const result = await store.dispatch(
      drilldownApi.endpoints.getPartitionRows.initiate({ dataset: { scope: 'default' } })
    );
    if ('data' in result) {
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toMatchObject({
        dma: expect.any(String),
        parent: expect.any(String),
      });
    } else {
      expect.fail('expected fulfilled result');
    }
  });
});
