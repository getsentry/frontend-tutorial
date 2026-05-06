import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import 'highcharts/modules/xrange';
import 'highcharts/modules/accessibility';
import HighchartsReact from 'highcharts-react-official';

import {
  getPartitionData,
  leafLabel,
  normalizeRows,
  slugParent,
} from './buildPartitionSeriesData.js';
import {
  applyPartitionRowHeights,
  createPartitionChartOptions,
  getOverviewRowHeightRatios,
} from './partitionChartOptions.js';

/**
 * @typedef {import('./buildPartitionSeriesData.js').PartitionHierarchy} PartitionHierarchy
 */

/**
 * @typedef {Object} DrillState
 * @property {string|null} [parentValue] - Selected parent band label; null at overview.
 * @property {number|null} [leafIndex] - Selected leaf index within that parent; null until leaf click.
 */

/**
 * @typedef {Object} LevelClickPayload
 * @property {string|number|undefined} [streamId]
 * @property {'grandparent'|'parent'|'leaf'} level
 * @property {'select'|'back-parent'|'back-overview'} action
 * @property {string[]} path - Labels from root → current focus
 * @property {{ row?: object, parentKey?: string, leafIndex?: number, drillId?: string }} raw
 */

function buildDrillPath(rows, hierarchy, drillParentName, leafIndex) {
  const n = normalizeRows(rows, hierarchy);
  if (drillParentName == null) return [];
  const slice = n.filter((r) => r.parent === drillParentName);
  const gp = slice[0]?.grandparent ?? 'Total';
  if (leafIndex == null) return [gp, drillParentName];
  const leaf = slice[leafIndex]?.leaf;
  if (leaf == null) return [gp, drillParentName];
  return [gp, drillParentName, leaf];
}

/**
 * Icicle / partition chart: pass flat `data` rows and a `hierarchy` field map.
 * Fires `onLevelClick` for chart drill actions and built-in nav buttons.
 *
 * @param {object} props
 * @param {Record<string, unknown>[]} props.data
 * @param {PartitionHierarchy} props.hierarchy
 * @param {string|number} [props.streamId]
 * @param {string} [props.chartInstanceKey] - Stable React key for Highcharts (dataset identity); omit drill state so the chart updates in place on drill.
 * @param {DrillState} [props.drillState] - Controlled drill; use with `onDrillStateChange`.
 * @param {(state: DrillState) => void} [props.onDrillStateChange]
 * @param {(payload: LevelClickPayload) => void} [props.onLevelClick]
 * @param {string} [props.chartTitle]
 * @param {string} [props.captionText]
 * @param {string} [props.className]
 * @param {boolean} [props.showBuiltInNav=true]
 * @param {boolean} [props.interactive=true]
 */
export function PartitionIcicleChart({
  data: rows,
  hierarchy,
  streamId,
  chartInstanceKey,
  drillState: controlledDrill,
  onDrillStateChange,
  onLevelClick,
  chartTitle,
  captionText,
  className = '',
  showBuiltInNav = true,
  interactive = true,
}) {
  const isControlled =
    typeof onDrillStateChange === 'function' && controlledDrill != null;

  const [internalParent, setInternalParent] = useState(null);
  const [internalLeaf, setInternalLeaf] = useState(null);
  const chartRef = useRef(null);

  const drillParentName = isControlled
    ? (controlledDrill.parentValue ?? null)
    : internalParent;
  const leafIndex = isControlled ? (controlledDrill.leafIndex ?? null) : internalLeaf;

  const setDrillState = useCallback(
    (next) => {
      if (isControlled) {
        onDrillStateChange(next);
      } else {
        setInternalParent(next.parentValue ?? null);
        setInternalLeaf(next.leafIndex ?? null);
      }
    },
    [isControlled, onDrillStateChange]
  );

  const emit = useCallback(
    (partial) => {
      if (typeof onLevelClick !== 'function') return;
      /** @type {LevelClickPayload} */
      const payload = {
        streamId,
        level: partial.level,
        action: partial.action,
        path: partial.path ?? [],
        raw: partial.raw ?? {},
      };
      onLevelClick(payload);
    },
    [onLevelClick, streamId]
  );

  const handleDrillParent = useCallback(
    (parentName) => {
      setDrillState({ parentValue: parentName, leafIndex: null });
      emit({
        level: 'parent',
        action: 'select',
        path: buildDrillPath(rows, hierarchy, parentName, null),
        raw: { parentKey: parentName, drillId: slugParent(parentName) },
      });
    },
    [emit, hierarchy, rows, setDrillState]
  );

  const handleSelectLeaf = useCallback(
    (idx) => {
      setDrillState({ parentValue: drillParentName, leafIndex: idx });
      const slice = normalizeRows(rows, hierarchy).filter(
        (r) => r.parent === drillParentName
      );
      emit({
        level: 'leaf',
        action: 'select',
        path: buildDrillPath(rows, hierarchy, drillParentName, idx),
        raw: {
          parentKey: drillParentName,
          leafIndex: idx,
          row: slice[idx]?.raw,
        },
      });
    },
    [drillParentName, emit, hierarchy, rows, setDrillState]
  );

  const handleBackToParentBreakdown = useCallback(() => {
    setDrillState({ parentValue: drillParentName, leafIndex: null });
    emit({
      level: 'leaf',
      action: 'back-parent',
      path: buildDrillPath(rows, hierarchy, drillParentName, null),
      raw: { parentKey: drillParentName },
    });
  }, [drillParentName, emit, hierarchy, rows, setDrillState]);

  const handleBackToOverview = useCallback(() => {
    setDrillState({ parentValue: null, leafIndex: null });
    emit({
      level: 'parent',
      action: 'back-overview',
      path: [],
      raw: {},
    });
  }, [emit, setDrillState]);

  const seriesData = useMemo(
    () => getPartitionData(rows, hierarchy, drillParentName, leafIndex),
    [rows, hierarchy, drillParentName, leafIndex]
  );

  const maxY = useMemo(
    () => (seriesData.length ? Math.max(...seriesData.map((d) => d.y ?? 0)) : 0),
    [seriesData]
  );
  const useOverviewMultiSeriesLayout = drillParentName == null && maxY >= 2;
  const rowHeightRatiosOverride = useOverviewMultiSeriesLayout
    ? getOverviewRowHeightRatios()
    : undefined;

  const options = useMemo(
    () =>
      createPartitionChartOptions({
        data: seriesData,
        rows,
        hierarchy,
        drillParentName,
        leafIndex,
        interactive,
        chartTitle,
        captionText,
        onDrillParent: handleDrillParent,
        onSelectLeaf: handleSelectLeaf,
      }),
    [
      seriesData,
      rows,
      hierarchy,
      drillParentName,
      leafIndex,
      interactive,
      chartTitle,
      captionText,
      handleDrillParent,
      handleSelectLeaf,
    ]
  );

  useLayoutEffect(() => {
    const chart = chartRef.current?.chart;
    if (!chart || chart.destroyed) return;
    requestAnimationFrame(() => {
      applyPartitionRowHeights(chart, true, rowHeightRatiosOverride);
    });
  }, [options, rowHeightRatiosOverride]);

  const leafName =
    leafIndex == null ? null : leafLabel(rows, hierarchy, drillParentName, leafIndex);

  const highchartsKey = chartInstanceKey ?? `icicle-${String(streamId ?? '')}`;

  return (
    <div className={className}>
      {showBuiltInNav && drillParentName !== null && drillParentName !== undefined ? (
        <nav className="partition-drill-nav" aria-label="Drilldown path">
          {leafIndex === null || leafIndex === undefined ? null : (
            <button
              type="button"
              className="partition-drill-nav__back"
              onClick={handleBackToParentBreakdown}
            >
              Back to parent breakdown
            </button>
          )}
          <button
            type="button"
            className="partition-drill-nav__back"
            onClick={handleBackToOverview}
          >
            Back to overview
          </button>
          <span className="partition-drill-nav__path">
            Focus:{' '}
            <span className="partition-drill-nav__current">
              {drillParentName}
              {leafName ? ` → ${leafName}` : ''}
            </span>
          </span>
        </nav>
      ) : null}

      <div className="chart-demo-wrap chart-demo-wrap--flame chart-demo-wrap--flame-light">
        <HighchartsReact
          ref={chartRef}
          highcharts={Highcharts}
          options={options}
          key={highchartsKey}
        />
      </div>
    </div>
  );
}

export default PartitionIcicleChart;
