import { useCallback, useMemo, useState } from 'react';
import Highcharts from 'highcharts';
import 'highcharts/modules/xrange';
import 'highcharts/modules/exporting';
import 'highcharts/modules/offline-exporting';
import 'highcharts/modules/accessibility';
import HighchartsReact from 'highcharts-react-official';

import './styles.css';

/**
 * Partition-style flame chart with level drilldown. Uses `series.xrange`.
 * React: https://www.highcharts.com/docs/react/getting-started — this app uses
 * `highcharts-react-official` with the same Highcharts module side-effect imports.
 * https://api.highcharts.com/highcharts/plotOptions.xrange
 */

const COL = {
  total: '#7c3aed',
  national: '#f97316',
  north: '#38bdf8',
  south: '#1d4ed8',
  central: '#93c5fd',
};

const NORTH_LEAF = [
  '#22c55e',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#6366f1',
  '#0ea5e9',
  '#14b8a6',
  '#f59e0b',
  '#dc2626',
  '#d946ef',
  '#4ade80',
  '#fb923c',
];

/** Region keys used for drill path (one level from overview). */
const DRILL_REGION_IDS = new Set(['national', 'north', 'south', 'central']);

const REGION_TITLE = {
  national: 'National',
  north: 'North region',
  south: 'South region',
  central: 'Central region',
};

const labelLight = { style: { color: '#0f172a', textOutline: 'none' } };

function getRowCount(data) {
  if (!data.length) return 1;
  return Math.max(...data.map((d) => d.y)) + 1;
}

function depthCategories(rowCount) {
  return Array.from({ length: rowCount }, () => '');
}

/** Full overview: Total → four regions → leaf row (reference layout). */
function buildRootPartitionData() {
  const data = [];

  data.push({
    name: 'Total',
    x: 0,
    x2: 100,
    y: 0,
    color: COL.total,
  });

  data.push(
    {
      name: 'National',
      x: 0,
      x2: 42,
      y: 1,
      color: COL.national,
      custom: { drillId: 'national' },
    },
    {
      name: 'North region',
      x: 42,
      x2: 58,
      y: 1,
      color: COL.north,
      custom: { drillId: 'north' },
    },
    {
      name: 'South region',
      x: 58,
      x2: 75,
      y: 1,
      color: COL.south,
      custom: { drillId: 'south' },
    },
    {
      name: 'Central region',
      x: 75,
      x2: 100,
      y: 1,
      color: COL.central,
      dataLabels: labelLight,
      custom: { drillId: 'central' },
    },
  );

  const northSpan = 58 - 42;
  for (let i = 0; i < 15; i++) {
    const x = 42 + (i * northSpan) / 15;
    const x2 = 42 + ((i + 1) * northSpan) / 15;
    data.push({
      name: '\u00b7',
      x,
      x2,
      y: 2,
      color: NORTH_LEAF[i % NORTH_LEAF.length],
    });
  }

  data.push(
    { name: '\u00b7', x: 58, x2: 63.6667, y: 2, color: '#ec4899' },
    { name: '\u00b7', x: 63.6667, x2: 69.3333, y: 2, color: '#172554' },
    {
      name: '\u00b7',
      x: 69.3333,
      x2: 75,
      y: 2,
      color: '#e0f2fe',
      dataLabels: labelLight,
    },
  );

  data.push(
    { name: '\u00b7', x: 75, x2: 87.5, y: 2, color: '#34d399' },
    { name: '\u00b7', x: 87.5, x2: 100, y: 2, color: '#fde047', dataLabels: labelLight },
  );

  return data;
}

/** Drilled view: focus row + children normalized to 0–100 (one region). */
function buildDrilledPartitionData(regionId) {
  if (regionId === 'national') {
    return [
      {
        name: 'National',
        x: 0,
        x2: 100,
        y: 0,
        color: COL.national,
      },
      {
        name: 'No sub-regions in reference data',
        x: 0,
        x2: 100,
        y: 1,
        color: '#fef3c7',
        dataLabels: labelLight,
      },
    ];
  }

  if (regionId === 'north') {
    const out = [
      {
        name: 'North region',
        x: 0,
        x2: 100,
        y: 0,
        color: COL.north,
      },
    ];
    const n = 15;
    for (let i = 0; i < n; i++) {
      const x = (i * 100) / n;
      const x2 = ((i + 1) * 100) / n;
      out.push({
        name: '\u00b7',
        x,
        x2,
        y: 1,
        color: NORTH_LEAF[i % NORTH_LEAF.length],
      });
    }
    return out;
  }

  if (regionId === 'south') {
    return [
      {
        name: 'South region',
        x: 0,
        x2: 100,
        y: 0,
        color: COL.south,
      },
      { name: '\u00b7', x: 0, x2: 100 / 3, y: 1, color: '#ec4899' },
      { name: '\u00b7', x: 100 / 3, x2: (2 * 100) / 3, y: 1, color: '#172554' },
      {
        name: '\u00b7',
        x: (2 * 100) / 3,
        x2: 100,
        y: 1,
        color: '#e0f2fe',
        dataLabels: labelLight,
      },
    ];
  }

  if (regionId === 'central') {
    return [
      {
        name: 'Central region',
        x: 0,
        x2: 100,
        y: 0,
        color: COL.central,
        dataLabels: labelLight,
      },
      { name: '\u00b7', x: 0, x2: 50, y: 1, color: '#34d399' },
      { name: '\u00b7', x: 50, x2: 100, y: 1, color: '#fde047', dataLabels: labelLight },
    ];
  }

  return buildRootPartitionData();
}

function getPartitionData(drillPath) {
  if (!drillPath?.length) return buildRootPartitionData();
  const id = drillPath[0];
  return DRILL_REGION_IDS.has(id) ? buildDrilledPartitionData(id) : buildRootPartitionData();
}

function fitXRangeRowHeight(chart, redraw = true) {
  const series = chart.series[0];
  if (!series?.data?.length) return;
  const ys = series.data.map((p) => p.y);
  const rows = Math.max(...ys) + 1;
  const pw = Math.max(8, Math.floor(chart.plotHeight / rows));
  series.update({ pointWidth: pw }, redraw);
}

/** Blue callout: elbow to “North region” on overview only. */
function drawNorthCallout(chart, showCallout) {
  if (chart.partitionCallout) {
    chart.partitionCallout.destroy();
    chart.partitionCallout = undefined;
  }

  if (!showCallout) return;

  const series = chart.series[0];
  const north = series?.points?.find((p) => p.name === 'North region');
  if (!north?.shapeArgs) return;

  const g = chart.renderer.g().attr({ zIndex: 10 }).add();
  chart.partitionCallout = g;

  const { x: sx, y: sy } = north.shapeArgs;
  const xLeft = chart.plotLeft + sx;
  const yTop = chart.plotTop + sy;
  const pw = series.options.pointWidth ?? 20;
  const yMid = yTop + pw / 2;
  const startX = chart.plotLeft + 6;

  chart.renderer
    .path(['M', startX, yMid, 'L', xLeft, yMid, 'L', xLeft, yTop + 4])
    .attr({
      stroke: '#2563eb',
      'stroke-width': 2,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
      fill: 'none',
    })
    .add(g);

  chart.renderer
    .circle(xLeft + 5, yTop + 5, 6)
    .attr({
      fill: '#2563eb',
      stroke: '#ffffff',
      'stroke-width': 1,
    })
    .add(g);
}

function createFlameChartOptions({
  drillPath,
  data,
  rowCount,
  canDrillFromChart,
  onDrillRegion,
}) {
  const showNorthCallout = drillPath.length === 0;

  return {
    chart: {
      type: 'xrange',
      backgroundColor: '#ffffff',
      plotBackgroundColor: '#ffffff',
      plotBorderWidth: 0,
      borderRadius: 12,
      spacing: [16, 16, 16, 16],
      marginLeft: 12,
      marginRight: 12,
      marginTop: 12,
      marginBottom: 12,
      style: {
        fontFamily:
          "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      animation: { duration: 450 },
      zooming: { type: 'x' },
      panning: { enabled: true, type: 'x' },
      panKey: 'shift',
      events: {
        load() {
          const el = this.credits?.element;
          if (el) el.setAttribute('tabindex', '-1');

          requestAnimationFrame(() => {
            fitXRangeRowHeight(this, true);
            drawNorthCallout(this, showNorthCallout);
          });
        },
        redraw() {
          drawNorthCallout(this, showNorthCallout);
        },
      },
    },

    title: {
      text: 'Partition flame chart',
      align: 'left',
      margin: 12,
      style: { fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' },
    },

    subtitle: {
      text: showNorthCallout
        ? 'Click a region (middle row) to drill down. Back returns to overview.'
        : `Drilled into ${REGION_TITLE[drillPath[0]] ?? drillPath[0]}. Use Back to return.`,
      align: 'left',
      style: { color: '#64748b' },
    },

    caption: {
      text: 'series.xrange · level drilldown via point.custom.drillId',
      align: 'left',
      margin: 10,
      style: { fontSize: '0.8rem', color: '#94a3b8' },
    },

    credits: {
      enabled: true,
      text: 'Highcharts xrange',
      href: 'https://api.highcharts.com/highcharts/plotOptions.xrange',
      style: { color: '#94a3b8' },
    },

    time: { useUTC: false },

    xAxis: {
      type: 'linear',
      min: 0,
      max: 100,
      visible: false,
      lineWidth: 0,
      lineColor: 'transparent',
      tickLength: 0,
      tickWidth: 0,
      gridLineWidth: 0,
      minorGridLineWidth: 0,
      labels: { enabled: false },
      title: { text: null },
      crosshair: false,
    },

    yAxis: {
      categories: depthCategories(rowCount),
      reversed: true,
      min: 0,
      max: rowCount - 1,
      visible: false,
      lineWidth: 0,
      lineColor: 'transparent',
      tickLength: 0,
      tickWidth: 0,
      gridLineWidth: 0,
      minorGridLineWidth: 0,
      labels: { enabled: false },
      title: { text: null },
    },

    legend: { enabled: false },

    tooltip: {
      shared: false,
      borderRadius: 8,
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      style: { color: '#f8fafc' },
      formatter() {
        const p = this.point;
        const w = p.x2 - p.x;
        const pct = w.toFixed(2);
        const hint =
          canDrillFromChart && p.options?.custom?.drillId
            ? '<br/><span style="opacity:0.85">Click to drill into this region</span>'
            : '';
        return (
          `<b>${p.name}</b><br/>` +
          `<span style="opacity:0.85">Share of view</span> <b>${pct}%</b><br/>` +
          `<span style="opacity:0.85">Range</span> ${p.x.toFixed(2)} – ${p.x2.toFixed(2)}` +
          hint
        );
      },
    },

    plotOptions: {
      series: {
        animation: { duration: 500 },
        states: {
          inactive: { opacity: 0.5 },
          hover: { brightness: 0.08 },
        },
      },
      xrange: {
        grouping: false,
        pointPadding: 0,
        groupPadding: 0,
        borderRadius: 0,
        borderWidth: 1,
        borderColor: '#ffffff',
        minPointLength: 0,
        cursor: canDrillFromChart ? 'pointer' : 'default',
        point: {
          events: {
            click() {
              if (!canDrillFromChart) return;
              const id = this.options?.custom?.drillId;
              if (id) onDrillRegion(id);
            },
          },
        },
        dataLabels: {
          enabled: true,
          align: 'center',
          verticalAlign: 'middle',
          inside: true,
          crop: false,
          overflow: 'allow',
          padding: 2,
          style: {
            fontWeight: '600',
            fontSize: '0.75rem',
            color: '#ffffff',
            textOutline: '1px contrast',
          },
          formatter() {
            const w = this.point.shapeArgs?.width ?? 0;
            const n = this.point.name;
            if (!n || n === '\u00b7') return '';
            if (w < 36 && n.length > 6) return '';
            return n;
          },
        },
      },
    },

    series: [
      {
        name: 'Partition',
        borderColor: '#ffffff',
        data,
      },
    ],

    exporting: {
      enabled: true,
      fallbackToExportServer: false,
      sourceWidth: 1200,
      chartOptions: {
        plotOptions: { series: { dataLabels: { enabled: true } } },
      },
      buttons: {
        contextButton: {
          menuItems: [
            'viewFullscreen',
            'printChart',
            'separator',
            'downloadPNG',
            'downloadJPEG',
            'downloadPDF',
            'downloadSVG',
          ],
        },
      },
    },

    navigation: {
      buttonOptions: {
        theme: {
          fill: '#f1f5f9',
          stroke: '#cbd5e1',
          style: { color: '#0f172a' },
          r: 8,
          states: { hover: { fill: '#e2e8f0' }, select: { fill: '#dbeafe' } },
        },
      },
    },

    responsive: {
      rules: [
        {
          condition: { maxWidth: 640 },
          chartOptions: {
            plotOptions: {
              xrange: {
                dataLabels: { style: { fontSize: '0.65rem' } },
              },
            },
          },
        },
      ],
    },
  };
}

const App2 = () => {
  const [drillPath, setDrillPath] = useState([]);

  const onDrillRegion = useCallback((regionId) => {
    setDrillPath([regionId]);
  }, []);

  const onBackToOverview = useCallback(() => {
    setDrillPath([]);
  }, []);

  const options = useMemo(() => {
    const d = getPartitionData(drillPath);
    const rc = getRowCount(d);
    const canDrillFromChart = drillPath.length === 0;
    return createFlameChartOptions({
      drillPath,
      data: d,
      rowCount: rc,
      canDrillFromChart,
      onDrillRegion,
    });
  }, [drillPath, onDrillRegion]);

  const drilledLabel =
    drillPath.length > 0 ? REGION_TITLE[drillPath[0]] ?? drillPath[0] : null;

  return (
    <div className="app-shell">
      <header className="config-panel">
        <h1>Partition flame chart</h1>
        <p className="config-hint">
          Overview matches your reference (Total → regions → subdivisions).{' '}
          <strong>Click a region</strong> in the middle row to drill into that level; use{' '}
          <strong>Back to overview</strong> or clear the path to return. Built with Highcharts{' '}
          <code>xrange</code> and the official React wrapper pattern from{' '}
          <a
            href="https://www.highcharts.com/docs/react/getting-started"
            target="_blank"
            rel="noreferrer"
          >
            Highcharts React — Getting started
          </a>{' '}
          (<code>highcharts-react-official</code> + module imports).
        </p>
      </header>

      <section className="config-panel" aria-label="Flame chart">
        <h2 className="section-title">Chart</h2>

        {drillPath.length > 0 ? (
          <nav className="partition-drill-nav" aria-label="Drilldown path">
            <button type="button" className="partition-drill-nav__back" onClick={onBackToOverview}>
              Back to overview
            </button>
            <span className="partition-drill-nav__path">
              Focus: <span className="partition-drill-nav__current">{drilledLabel}</span>
            </span>
          </nav>
        ) : null}

        <p className="section-hint">
          Drag to zoom horizontally; Shift-drag to pan. On overview, click National / North / South /
          Central to open that level (normalized to 100% width).
        </p>
        <div className="chart-demo-wrap chart-demo-wrap--flame chart-demo-wrap--flame-light">
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            key={drillPath.join('-') || 'overview'}
          />
        </div>
      </section>
    </div>
  );
};

export default App2;
