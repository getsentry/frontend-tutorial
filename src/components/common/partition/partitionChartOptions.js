import { leafLabel, parseParentSlug } from './buildPartitionSeriesData.js';

export function getRowCount(data) {
  if (!data.length) return 1;
  return Math.max(...data.map((d) => d.y)) + 1;
}

const OVERVIEW_EQUAL_ROW_RATIOS = Object.freeze([1 / 3, 1 / 3, 1 / 3]);

/** Equal row heights for overview (no stealing height from grandparent/parent rows). */
export function getOverviewRowHeightRatios() {
  return OVERVIEW_EQUAL_ROW_RATIOS;
}

/** Split overview xrange `data` (y = 0 | 1 | 2) into three row bands for per-row `pointWidth`. */
export function splitOverviewDataByRow(data) {
  const rows = [[], [], []];
  for (const p of data) {
    const yi = p.y ?? 0;
    if (yi >= 0 && yi <= 2) rows[yi].push(p);
  }
  return rows;
}

/**
 * Applies vertical sizing: overview uses `chart.custom.rowHeightRatios` (multi-series);
 * drilled / fallback uses one series and equal row heights.
 * @param {number[] | undefined} [ratiosOverride] - When set (e.g. from React), preferred over chart options.
 */
export function applyPartitionRowHeights(chart, redraw = true, ratiosOverride) {
  const ratios =
    ratiosOverride ??
    chart.options.chart?.custom?.rowHeightRatios ??
    chart.userOptions?.chart?.custom?.rowHeightRatios;
  const ph = chart.plotHeight;
  if (!ph) return;

  if (
    Array.isArray(ratios) &&
    ratios.length > 0 &&
    chart.series.length >= ratios.length
  ) {
    let changed = false;
    ratios.forEach((r, i) => {
      if (!chart.series[i]) return;
      const pw = Math.max(6, Math.floor(r * ph));
      const prev = chart.series[i].options.pointWidth;
      if (prev !== pw) {
        chart.series[i].update({ pointWidth: pw }, false);
        changed = true;
      }
    });
    if (changed && redraw) {
      chart.redraw(false);
    }
    return;
  }

  const series = chart.series[0];
  if (!series?.data?.length) return;
  const ys = series.data.map((p) => p.y ?? 0);
  const rowN = Math.max(...ys) + 1;
  const pw = Math.max(8, Math.floor(ph / rowN));
  series.update({ pointWidth: pw }, redraw);
}

/** @deprecated Use {@link applyPartitionRowHeights} */
export function fitXRangeRowHeight(chart, redraw = true) {
  applyPartitionRowHeights(chart, redraw);
}

function destroyPartitionDecor(chart) {
  if (chart.partitionDecor) {
    chart.partitionDecor.destroy();
    chart.partitionDecor = undefined;
  }
}

function drawPartitionDecorations(chart, decor) {
  destroyPartitionDecor(chart);

  const { leafDeep } = decor;
  if (!chart.series.some((s) => s.points?.length)) return;
  if (!leafDeep) return;

  const series0 = chart.series[0];

  const g = chart.renderer
    .g()
    .attr({
      zIndex: 10,
      'pointer-events': 'none',
    })
    .add();
  chart.partitionDecor = g;

  const plotLeft = chart.plotLeft;
  const plotTop = chart.plotTop;
  const plotW = chart.plotWidth;
  const plotH = chart.plotHeight;

  chart.renderer
    .rect(plotLeft, plotTop, 10, plotH)
    .attr({
      fill: 'rgba(234, 179, 8, 0.35)',
      zIndex: 9,
    })
    .add(g);
  chart.renderer
    .rect(plotLeft + plotW - 10, plotTop, 10, plotH)
    .attr({
      fill: 'rgba(124, 58, 237, 0.35)',
      zIndex: 9,
    })
    .add(g);

  const totalPt = series0.points.find((p) => p.options?.custom?.rowRole === 'total');
  if (totalPt?.shapeArgs) {
    const { x: sx, y: sy, width, height } = totalPt.shapeArgs;
    chart.renderer
      .rect(plotLeft + sx - 1, plotTop + sy - 1, width + 2, height + 2)
      .attr({
        stroke: '#2563eb',
        'stroke-width': 3,
        fill: 'none',
        zIndex: 11,
      })
      .add(g);
  }

  const dmaPt = series0.points.find((p) => p.options?.custom?.rowRole === 'dmaLeaf');
  if (dmaPt?.shapeArgs) {
    const { x: dx, y: dy, width: dw, height: dh } = dmaPt.shapeArgs;
    chart.renderer
      .rect(plotLeft + dx + dw - 8, plotTop + dy, 8, dh)
      .attr({
        fill: 'rgba(21, 128, 61, 0.5)',
        zIndex: 10,
      })
      .add(g);
  }
}

function getSubtitle({ drillParentName, leafDeep, leafIndex, rows, hierarchy }) {
  if (drillParentName == null) {
    return 'Overview: click a parent band to drill.';
  }
  if (leafDeep) {
    const name = leafLabel(rows, hierarchy, drillParentName, leafIndex);
    return `Opened one level: ${name ?? 'Leaf'} — detail view.`;
  }
  return `Drilled into ${drillParentName} — click a leaf strip to open one level deeper.`;
}

/**
 * @param {object} opts
 * @param {import('./buildPartitionSeriesData.js').PartitionHierarchy} opts.hierarchy
 */
export function createPartitionChartOptions({
  data,
  rows,
  hierarchy,
  drillParentName,
  leafIndex,
  interactive,
  chartTitle,
  captionText,
  onDrillParent,
  onSelectLeaf,
}) {
  const rowCount = getRowCount(data);
  const canDrillFromChart = interactive && drillParentName == null;
  const leafDeep = interactive && drillParentName != null && leafIndex != null;

  const maxY = data.length ? Math.max(...data.map((d) => d.y ?? 0)) : 0;
  const useOverviewMultiSeries = drillParentName == null && maxY >= 2;
  const rowHeightRatios = useOverviewMultiSeries
    ? getOverviewRowHeightRatios()
    : undefined;

  const overviewSeries = useOverviewMultiSeries
    ? (() => {
        const [d0, d1, d2] = splitOverviewDataByRow(data);
        return [
          { type: 'xrange', name: 'Grandparent', data: d0, borderColor: '#ffffff' },
          { type: 'xrange', name: 'Parent', data: d1, borderColor: '#ffffff' },
          { type: 'xrange', name: 'Leaf', data: d2, borderColor: '#ffffff' },
        ];
      })()
    : [{ name: 'Partition', borderColor: '#ffffff', data }];

  const decorForChart = () => ({
    leafDeep,
  });

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
      custom: rowHeightRatios ? { rowHeightRatios } : {},
      events: {
        load() {
          const el = this.credits?.element;
          if (el) el.setAttribute('tabindex', '-1');

          requestAnimationFrame(() => {
            applyPartitionRowHeights(this, true);
            drawPartitionDecorations(this, decorForChart());
          });
        },
        redraw() {
          drawPartitionDecorations(this, decorForChart());
        },
      },
    },

    title: {
      text: chartTitle ?? 'Partition chart',
      align: 'left',
      margin: 12,
      style: { fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' },
    },

    subtitle: {
      text: getSubtitle({
        drillParentName,
        leafDeep,
        leafIndex,
        rows,
        hierarchy,
      }),
      align: 'left',
      style: { color: '#64748b' },
    },

    caption: {
      text:
        captionText ??
        'Flat rows + hierarchy props; layout and drill levels are derived.',
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
      categories: Array.from({ length: rowCount }, () => ''),
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
        const dma = p.options?.custom?.dmaIndex;
        const isParentBand =
          canDrillFromChart && p.options?.custom?.drillId && dma === undefined;
        const hintDrill = isParentBand
          ? '<br/><span style="opacity:0.85">Click to drill into this parent</span>'
          : '';
        const hintLeaf =
          dma !== undefined && drillParentName != null && leafIndex == null && interactive
            ? '<br/><span style="opacity:0.85">Click to open this leaf (one level)</span>'
            : '';
        return (
          `<b>${p.name}</b><br/>` +
          `<span style="opacity:0.85">Share of view</span> <b>${pct}%</b><br/>` +
          `<span style="opacity:0.85">Range</span> ${p.x.toFixed(2)} – ${p.x2.toFixed(2)}` +
          hintDrill +
          hintLeaf
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
        cursor:
          interactive &&
          (canDrillFromChart || (drillParentName != null && leafIndex == null))
            ? 'pointer'
            : 'default',
        point: {
          events: {
            click() {
              if (!interactive) return;
              const drillId = this.options?.custom?.drillId;
              if (drillId && canDrillFromChart) {
                const parentName = parseParentSlug(drillId);
                if (parentName) onDrillParent(parentName);
                return;
              }
              const idx = this.options?.custom?.dmaIndex;
              if (idx !== undefined && drillParentName != null && leafIndex == null) {
                onSelectLeaf(idx);
              }
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

    series: overviewSeries,

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
