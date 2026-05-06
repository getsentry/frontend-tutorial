import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  jumpToLevel,
  selectCard,
  setGlobalDatasetFilters,
  setLevels,
  setStatus,
  stepBack,
} from '../drilldownSlice.js';
import {
  selectCurrentLevel,
  selectCurrentLevelIndex,
  selectFiltersUpToPathStepInclusive,
  selectGlobalDatasetFilters,
  selectLevels,
  selectPath,
  selectStatus,
} from '../selectors.js';
import { isDmaDrillLevels, stableSerialize } from '../utils.js';
import {
  drilldownApi,
  useGetCardsQuery,
  useGetDmaAggregateTableQuery,
  useGetPartitionRowsQuery,
  useGetTableQuery,
} from '../../../services/drilldownApi.js';
import DmaIcicleDrillBridge from './DmaIcicleDrillBridge.jsx';
import Breadcrumb from './Breadcrumb.jsx';
import CardGrid from './CardGrid.jsx';
import DmaAggregateMetricsTable from './DmaAggregateMetricsTable.jsx';
import PageScopeFilter from './PageScopeFilter.jsx';
import GroupedDataTable from './GroupedDataTable.jsx';

const DrilldownContainer = ({ config }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const levels = useSelector(selectLevels);
  const currentLevel = useSelector(selectCurrentLevel);
  const currentLevelIndex = useSelector(selectCurrentLevelIndex);
  const path = useSelector(selectPath);
  const globalDatasetFilters = useSelector(selectGlobalDatasetFilters);

  useEffect(() => {
    dispatch(setLevels(config));
  }, [config, dispatch]);

  const cardFilters = useSelector((state) =>
    selectFiltersUpToPathStepInclusive(state, currentLevelIndex - 1)
  );

  const tableEndStep = path.length ? path.length - 1 : -1;
  const tableFilters = useSelector((state) =>
    selectFiltersUpToPathStepInclusive(state, tableEndStep)
  );

  const prefetchFilters = useSelector((state) =>
    selectFiltersUpToPathStepInclusive(state, currentLevelIndex)
  );

  const lastLevel = levels.length ? levels[levels.length - 1] : null;
  const isDmaAggregateView = isDmaDrillLevels(levels);

  const cardsArg = currentLevel
    ? { levelId: currentLevel.id, filters: cardFilters, dataset: globalDatasetFilters }
    : skipToken;

  const tableArg = useMemo(() => {
    if (isDmaAggregateView) {
      return skipToken;
    }
    if (!lastLevel || !levels.length) {
      return skipToken;
    }
    return {
      levelId: lastLevel.id,
      filters: tableFilters,
      dataset: globalDatasetFilters,
    };
  }, [isDmaAggregateView, globalDatasetFilters, lastLevel, levels.length, tableFilters]);

  const partitionArg = isDmaAggregateView ? { dataset: globalDatasetFilters } : skipToken;

  const cardsQuery = useGetCardsQuery(cardsArg);
  const tableQuery = useGetTableQuery(tableArg);
  const aggregateQuery = useGetDmaAggregateTableQuery(
    { dataset: globalDatasetFilters },
    { skip: !isDmaAggregateView }
  );
  const partitionQuery = useGetPartitionRowsQuery(partitionArg);

  const tableLoading = isDmaAggregateView
    ? aggregateQuery.isLoading
    : tableQuery.isLoading;

  useEffect(() => {
    const busy = cardsQuery.isLoading || tableLoading;
    if (busy) {
      dispatch(setStatus('loading'));
      return;
    }
    const state = store.getState();
    if (selectStatus(state) !== 'end' && selectLevels(state).length) {
      dispatch(setStatus('ready'));
    }
  }, [cardsQuery.isLoading, dispatch, store, tableLoading, levels.length]);

  useEffect(() => {
    const nextLevel = levels[currentLevelIndex + 1];
    if (!nextLevel) {
      return;
    }
    dispatch(
      drilldownApi.util.prefetch(
        'getCards',
        {
          levelId: nextLevel.id,
          filters: prefetchFilters,
          dataset: globalDatasetFilters,
        },
        { force: false }
      )
    );
  }, [currentLevelIndex, dispatch, globalDatasetFilters, levels, prefetchFilters]);

  const partitionDatasetKey = stableSerialize(globalDatasetFilters);
  const partitionRows = partitionQuery.data ?? [];
  const partitionShowSkeleton =
    isDmaAggregateView &&
    (partitionQuery.isUninitialized ||
      (partitionQuery.isLoading && !partitionQuery.data));

  const handleCardClick = (_, selectedValue) => {
    if (!currentLevel) {
      return;
    }
    dispatch(selectCard({ levelId: currentLevel.id, value: selectedValue }));
  };

  const handleJump = (levelIndex) => {
    dispatch(jumpToLevel(levelIndex));
  };

  const headerText = useMemo(() => {
    if (!currentLevel) {
      return 'No configured levels';
    }
    return `${currentLevel.label} — explore`;
  }, [currentLevel]);

  return (
    <main className="drilldown-shell">
      <header className="drilldown-header">
        <h1>DMA drilldown</h1>
        <p className="subtitle">{headerText}</p>
      </header>

      <Breadcrumb levels={levels} path={path} onJump={handleJump} />

      {isDmaAggregateView ? (
        <div className="page-scope-layout">
          <section className="dataset-toolbar" aria-label="Dataset scope">
            <label className="dataset-toolbar__label">
              <span className="dataset-toolbar__text">Dataset</span>
              <select
                className="dataset-toolbar__select"
                value={globalDatasetFilters.scope ?? 'default'}
                onChange={(e) =>
                  dispatch(
                    setGlobalDatasetFilters({
                      ...globalDatasetFilters,
                      scope: e.target.value,
                      selectedDmas: null,
                    })
                  )
                }
              >
                <option value="default">Default</option>
                <option value="alternate">Alternate weights</option>
              </select>
            </label>
          </section>
          <PageScopeFilter />
        </div>
      ) : null}

      {isDmaAggregateView ? (
        <section className="partition-embed" aria-label="Partition chart">
          {partitionShowSkeleton ? (
            <div
              className="partition-embed-skeleton"
              aria-hidden
              data-testid="partition-skeleton"
            />
          ) : (
            <DmaIcicleDrillBridge
              rows={partitionRows}
              streamId="dma-main"
              chartInstanceKey={`dma-${partitionDatasetKey}`}
              levels={levels}
            />
          )}
        </section>
      ) : null}

      <div className="toolbar">
        <button type="button" className="secondary" onClick={() => dispatch(stepBack())}>
          Back
        </button>
      </div>

      <section className="cards-section" aria-label="Card exploration">
        <h2 className="section-title">Explore (cards)</h2>
        <CardGrid items={cardsQuery.data ?? []} onCardClick={handleCardClick} />
      </section>

      <section className="table-section" aria-label="Summary table">
        <h2 className="section-title">Metrics</h2>
        <p className="section-hint">
          {isDmaAggregateView
            ? 'Regional rollups and DMA-level detail. The row matching your current selection is highlighted.'
            : 'Full table for the deepest context; rows are grouped by admin level order.'}
        </p>
        <div className="table-wrap">
          {isDmaAggregateView ? (
            <DmaAggregateMetricsTable
              rows={aggregateQuery.data ?? []}
              path={path}
              levels={levels}
            />
          ) : (
            <GroupedDataTable rows={tableQuery.data ?? []} levels={levels} />
          )}
        </div>
      </section>
    </main>
  );
};

export default DrilldownContainer;
