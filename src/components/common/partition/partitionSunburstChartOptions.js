import { leafLabel, parseParentSlug } from './buildPartitionSeriesData.js';

/**
 * Highcharts sunburst options aligned with {@link createPartitionChartOptions} where possible.
 * Sunburst extends pie; some chart-level options differ (no xrange axes).
 *
 * @see https://api.highcharts.com/highcharts/plotOptions.sunburst
 */

/**
 * @param {object} opts
 * @param {import('./buildPartitionSeriesData.js').PartitionHierarchy} opts.hierarchy
 */
export function createSunburstChartOptions({
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
  const canDrillParentFromOverview = interactive && drillParentName == null;
  const leafDeep = interactive && drillParentName != null && leafIndex != null;

  const getSubtitle = () => {
    if (drillParentName == null) {
      return 'Overview: click a parent ring to drill (same weights as icicle).';
    }
    if (leafDeep) {
      const name = leafLabel(rows, hierarchy, drillParentName, leafIndex);
      return `Opened one level: ${name ?? 'Leaf'} — detail view.`;
    }
    return `Drilled into ${drillParentName} — click a leaf segment to open one level deeper.`;
  };

  const legendTitleText = leafDeep ? 'Focused path' : 'Leaves';

  return {
    accessibility: {
      enabled: true,
      description: chartTitle ?? 'Sunburst hierarchy chart',
      point: {
        descriptionFormatter(point) {
          return `${point.name}: value ${point.value ?? point.options?.value ?? ''}`;
        },
      },
    },

    chart: {
      backgroundColor: '#ffffff',
      plotBackgroundColor: '#ffffff',
      plotBorderWidth: 0,
      borderRadius: 12,
      spacing: [16, 16, 16, 16],
      marginLeft: 12,
      marginRight: 8,
      marginTop: 12,
      marginBottom: 12,
      style: {
        fontFamily:
          "'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      },
      animation: { duration: 450 },
      panning: { enabled: false },
      events: {
        load() {
          const el = this.credits?.element;
          if (el) el.setAttribute('tabindex', '-1');
        },
      },
    },

    title: {
      text: chartTitle ?? 'Sunburst chart',
      align: 'left',
      margin: 12,
      style: { fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' },
    },

    subtitle: {
      text: getSubtitle(),
      align: 'left',
      style: { color: '#64748b' },
    },

    caption: {
      text:
        captionText ??
        'Hierarchical rings: Total → grandparent → parent → leaf; values match flat row weights.',
      align: 'left',
      margin: 10,
      style: { fontSize: '0.8rem', color: '#94a3b8' },
    },

    credits: {
      enabled: true,
      text: 'Highcharts sunburst',
      href: 'https://api.highcharts.com/highcharts/series.sunburst',
      style: { color: '#94a3b8' },
    },

    time: { useUTC: false },

    legend: {
      enabled: true,
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      floating: false,
      margin: 16,
      padding: 12,
      itemMarginTop: 6,
      itemMarginBottom: 2,
      symbolWidth: 12,
      symbolHeight: 12,
      symbolRadius: 3,
      maxHeight: 220,
      navigation: {
        activeColor: '#4f46e5',
        inactiveColor: '#94a3b8',
        style: { fontWeight: '600' },
      },
      itemStyle: {
        fontWeight: '500',
        fontSize: '12px',
        color: '#334155',
      },
      itemHoverStyle: { color: '#0f172a' },
      title: {
        text: legendTitleText,
        style: { fontSize: '11px', fontWeight: '700', color: '#64748b' },
      },
      /**
       * Requires `legendType: 'point'` on the series so `this` is each point
       * (see Highcharts Legend#getAllItems).
       */
      labelFormatter() {
        const custom = this.options?.custom;
        if (custom?.legendName) return custom.legendName;
        return this.name ?? '';
      },
    },

    tooltip: {
      shared: false,
      borderRadius: 8,
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      style: { color: '#f8fafc' },
      followPointer: true,
      stickOnContact: true,
      formatter() {
        const p = this.point;
        const v = p.options?.value ?? p.value ?? 0;
        const c = p.options?.custom;
        const isParent =
          canDrillParentFromOverview && c?.level === 'parent' && c?.drillId;
        const hintDrill = isParent
          ? '<br/><span style="opacity:0.85">Click to drill into this parent</span>'
          : '';
        const hintLeaf =
          c?.dmaIndex !== undefined &&
          drillParentName != null &&
          leafIndex == null &&
          interactive
            ? '<br/><span style="opacity:0.85">Click to open this leaf (one level)</span>'
            : '';
        return (
          `<b>${p.name}</b><br/>` +
          `<span style="opacity:0.85">Value</span> <b>${v}</b><br/>` +
          `<span style="opacity:0.85">Share of parent</span> <b>${(p.percentage ?? 0).toFixed(1)}%</b>` +
          hintDrill +
          hintLeaf
        );
      },
    },

    plotOptions: {
      series: {
        animation: { duration: 500 },
        states: {
          inactive: { opacity: 0.45 },
          hover: { brightness: 0.12, halo: { size: 10, opacity: 0.25 } },
        },
        sonification: {
          showInLegend: false,
          defaultInstrumentOptions: {
            mapping: {
              pitch: {
                mapTo: 'value',
                min: 36,
                max: 72,
              },
              gapBetweenNotes: 140,
            },
          },
        },
      },

      sunburst: {
        /** One legend row per point (not one row for the whole series). */
        legendType: 'point',
        allowDrillToNode: false,
        allowTraversingTree: false,
        borderColor: '#ffffff',
        borderWidth: 1,
        borderRadius: 3,
        center: ['50%', '50%'],
        clip: false,
        colorByPoint: false,
        cursor: interactive ? 'pointer' : 'default',
        enableMouseTracking: true,
        inactiveOtherPoints: true,
        levelIsConstant: true,
        slicedOffset: 10,
        opacity: 1,
        shadow: {
          color: 'rgba(15, 23, 42, 0.12)',
          offsetX: 1,
          offsetY: 2,
          width: 4,
        },
        startAngle: 0,
        innerSize: '14%',
        size: '78%',
        showInLegend: true,

        levelSize: {
          value: 1,
          unit: 'weight',
        },

        /** Breadcrumb navigation (internal drill). Disabled here so Redux + icicle stay the single source of truth; options kept for API completeness. */
        breadcrumbs: {
          enabled: false,
          position: { align: 'left' },
          floating: false,
          padding: 8,
          itemStyle: { color: '#334155', fontWeight: '600' },
          buttonTheme: {
            fill: '#f1f5f9',
            padding: 6,
            stroke: '#cbd5e1',
            'stroke-width': 1,
            r: 8,
            style: { color: '#0f172a' },
            states: { hover: { fill: '#e2e8f0' } },
          },
        },

        /** @deprecated — replaced by breadcrumbs in v9.3.3; API surface preserved. */
        traverseUpButton: {
          position: { align: 'right', verticalAlign: 'top', x: -12, y: 12 },
          text: '← Up',
          theme: {
            fill: '#f8fafc',
            padding: 6,
            stroke: '#94a3b8',
            r: 8,
          },
        },

        stickyTracking: true,
        turboThreshold: 0,

        dataLabels: {
          enabled: true,
          allowOverlap: true,
          defer: true,
          rotationMode: 'circular',
          align: 'center',
          verticalAlign: 'middle',
          padding: 2,
          crop: false,
          overflow: 'allow',
          style: {
            fontWeight: '600',
            fontSize: '0.72rem',
            color: '#0f172a',
            textOutline: '1px contrast',
          },
          formatter() {
            const pct = this.point.percentage ?? 0;
            if (pct < 4) return '';
            return this.point.name;
          },
        },

        levels: [
          {
            level: 1,
            levelSize: { value: 1, unit: 'weight' },
            colorByPoint: false,
            borderWidth: 2,
            borderColor: '#ffffff',
            dataLabels: {
              rotationMode: 'parallel',
              style: { fontSize: '0.75rem', color: '#0f172a' },
            },
          },
          {
            level: 2,
            levelSize: { value: 1.1, unit: 'weight' },
            borderDashStyle: 'Solid',
            dataLabels: {
              rotationMode: 'perpendicular',
              style: { fontSize: '0.7rem' },
            },
          },
          {
            level: 3,
            levelSize: { value: 1, unit: 'weight' },
            colorVariation: { key: 'brightness', to: -0.12 },
            dataLabels: {
              rotationMode: 'circular',
              style: { fontSize: '0.65rem' },
            },
          },
          {
            level: 4,
            levelSize: { value: 1, unit: 'weight' },
            dataLabels: {
              rotationMode: 'auto',
              style: { fontSize: '0.62rem' },
            },
          },
        ],

        point: {
          events: {
            click() {
              if (!interactive) return;
              const c = this.options?.custom;
              if (c?.level === 'parent' && c?.drillId && canDrillParentFromOverview) {
                const name = parseParentSlug(c.drillId);
                if (name) onDrillParent(name);
                return;
              }
              if (
                c?.dmaIndex !== undefined &&
                drillParentName != null &&
                leafIndex == null
              ) {
                onSelectLeaf(c.dmaIndex);
              }
            },
          },
        },

        states: {
          hover: {
            brightness: 0.08,
            borderColor: '#0f172a',
            borderWidth: 2,
          },
          select: {
            color: '#6366f1',
            borderColor: '#312e81',
            borderWidth: 2,
          },
          inactive: {
            opacity: 0.35,
          },
        },
      },
    },

    series: [
      {
        type: 'sunburst',
        name: 'Partition',
        legendType: 'point',
        data,
        borderColor: '#ffffff',
        borderWidth: 1,
        showInLegend: true,
      },
    ],

    responsive: {
      rules: [
        {
          condition: { maxWidth: 640 },
          chartOptions: {
            legend: {
              align: 'center',
              verticalAlign: 'bottom',
              layout: 'horizontal',
              width: '100%',
              margin: 8,
            },
            chart: {
              marginBottom: 16,
            },
            plotOptions: {
              sunburst: {
                size: '72%',
                dataLabels: { style: { fontSize: '0.62rem' } },
              },
            },
          },
        },
      ],
    },
  };
}
