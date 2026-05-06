import { useCallback, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import 'highcharts/modules/sunburst';
import 'highcharts/modules/accessibility';
import 'highcharts/modules/sonification';
import HighchartsReact from 'highcharts-react-official';

import { getSunburstPartitionData } from './buildPartitionSunburstData.js';
import { leafLabel, normalizeRows, slugParent } from './buildPartitionSeriesData.js';
import { createSunburstChartOptions } from './partitionSunburstChartOptions.js';

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
 * @typedef {import('./buildPartitionSeriesData.js').PartitionHierarchy} PartitionHierarchy
 */

/**
 * @typedef {Object} DrillState
 * @property {string|null} [parentValue]
 * @property {number|null} [leafIndex]
 */

/**
 * @typedef {Object} LevelClickPayload
 * @property {string|number|undefined} [streamId]
 * @property {'grandparent'|'parent'|'leaf'} level
 * @property {'select'|'back-parent'|'back-overview'} action
 * @property {string[]} path
 * @property {{ row?: object, parentKey?: string, leafIndex?: number, drillId?: string }} raw
 */

/**
 * Sunburst view for the same flat rows + hierarchy as {@link PartitionIcicleChart}.
 *
 * @param {object} props
 * @param {Record<string, unknown>[]} props.data
 * @param {PartitionHierarchy} props.hierarchy
 * @param {string|number} [props.streamId]
 * @param {string} [props.chartInstanceKey]
 * @param {DrillState} [props.drillState]
 * @param {(state: DrillState) => void} [props.onDrillStateChange]
 * @param {(payload: LevelClickPayload) => void} [props.onLevelClick]
 * @param {string} [props.chartTitle]
 * @param {string} [props.captionText]
 * @param {string} [props.className]
 * @param {boolean} [props.showBuiltInNav=true]
 * @param {boolean} [props.interactive=true]
 */
export function PartitionSunburstChart({
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
    () => getSunburstPartitionData(rows, hierarchy, drillParentName, leafIndex),
    [rows, hierarchy, drillParentName, leafIndex]
  );

  const options = useMemo(
    () =>
      createSunburstChartOptions({
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

  const leafName =
    leafIndex == null ? null : leafLabel(rows, hierarchy, drillParentName, leafIndex);

  const highchartsKey = chartInstanceKey ?? `sunburst-${String(streamId ?? '')}`;

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
        <HighchartsReact highcharts={Highcharts} options={options} key={highchartsKey} />
      </div>
    </div>
  );
}

export default PartitionSunburstChart;
