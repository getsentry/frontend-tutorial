import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  normalizeCardsResponse,
  normalizeTableResponse,
  stableSerialize,
} from '../features/drilldown/utils.js';
import {
  buildDmaAggregateTableRows,
  getMockCards,
  getMockTable,
  getPartitionRowsForDataset,
  shouldUseMockData,
} from '../mocks/drilldownMockEngine.js';

const networkBaseQuery = fetchBaseQuery({ baseUrl: '/' });

export const drilldownApi = createApi({
  reducerPath: 'drilldownApi',
  baseQuery: networkBaseQuery,
  endpoints: (builder) => ({
    getCards: builder.query({
      async queryFn(args, api, extraOptions, baseQuery) {
        const dataset = args?.dataset ?? {};
        if (shouldUseMockData()) {
          return { data: normalizeCardsResponse(getMockCards({ ...args, dataset })) };
        }

        const response = await baseQuery(
          {
            url: 'drilldown/cards',
            method: 'POST',
            body: { levelId: args.levelId, filters: args.filters, dataset },
          },
          api,
          extraOptions
        );

        if (response.error) {
          return { data: normalizeCardsResponse(getMockCards({ ...args, dataset })) };
        }

        return { data: normalizeCardsResponse(response.data) };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}|${queryArgs.levelId}|${stableSerialize(queryArgs.filters ?? {})}|${stableSerialize(queryArgs.dataset ?? {})}`,
    }),
    getTable: builder.query({
      async queryFn(args, api, extraOptions, baseQuery) {
        const dataset = args?.dataset ?? {};
        if (shouldUseMockData()) {
          return { data: normalizeTableResponse(getMockTable({ ...args, dataset })) };
        }

        const response = await baseQuery(
          {
            url: 'drilldown/table',
            method: 'POST',
            body: { levelId: args.levelId, filters: args.filters, dataset },
          },
          api,
          extraOptions
        );

        if (response.error) {
          return { data: normalizeTableResponse(getMockTable({ ...args, dataset })) };
        }

        return { data: normalizeTableResponse(response.data) };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}|${queryArgs.levelId}|${stableSerialize(queryArgs.filters ?? {})}|${stableSerialize(queryArgs.dataset ?? {})}`,
    }),
    getDmaAggregateTable: builder.query({
      async queryFn(args = {}, api, extraOptions, baseQuery) {
        const dataset = args?.dataset ?? {};
        if (shouldUseMockData()) {
          return { data: normalizeTableResponse(buildDmaAggregateTableRows(dataset)) };
        }

        const response = await baseQuery(
          {
            url: 'drilldown/aggregate-table',
            method: 'POST',
            body: { dataset },
          },
          api,
          extraOptions
        );

        if (response.error) {
          return { data: normalizeTableResponse(buildDmaAggregateTableRows(dataset)) };
        }

        return { data: normalizeTableResponse(response.data) };
      },
      serializeQueryArgs: ({ queryArgs }) =>
        `getDmaAggregateTable|${stableSerialize(queryArgs?.dataset ?? {})}`,
    }),
    getPartitionRows: builder.query({
      async queryFn(args = {}, api, extraOptions, baseQuery) {
        const dataset = args?.dataset ?? {};
        if (shouldUseMockData()) {
          return { data: getPartitionRowsForDataset(dataset) };
        }

        const response = await baseQuery(
          {
            url: 'drilldown/partition-rows',
            method: 'POST',
            body: { dataset },
          },
          api,
          extraOptions
        );

        if (response.error) {
          return { data: getPartitionRowsForDataset(dataset) };
        }

        return { data: response.data };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}|${stableSerialize(queryArgs?.dataset ?? {})}`,
    }),
  }),
});

export const {
  useGetCardsQuery,
  useGetDmaAggregateTableQuery,
  useGetPartitionRowsQuery,
  useGetTableQuery,
} = drilldownApi;
