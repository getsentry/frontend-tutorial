/**
 * Hierarchical sunburst series data (id + parent + value) derived from the same
 * flat rows + hierarchy as the icicle / xrange partition chart.
 */

import { normalizeRows, rowWeight, slugParent } from './buildPartitionSeriesData.js';

const DMA_COLORS = [
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

function colorForParent(key, i) {
  if (i != null) return DMA_COLORS[i % DMA_COLORS.length];
  let h = 0;
  for (let c = 0; c < key.length; c++) h = (h * 31 + key.charCodeAt(c)) % 360;
  return `hsl(${h} 70% 52%)`;
}

function uniqueOrdered(values) {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/** Preserve first-seen order of (grandparent, parent) pairs. */
function uniqueGrandparentParentPairs(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = `${r.grandparent}\u0000${r.parent}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ gp: r.grandparent, p: r.parent });
    }
  }
  return out;
}

function sumValues(list) {
  return list.reduce((s, r) => s + rowWeight(r), 0);
}

function idGp(gp) {
  return `gp:${encodeURIComponent(gp)}`;
}

function idParent(gp, p) {
  return `pr:${encodeURIComponent(gp)}|${encodeURIComponent(p)}`;
}

function idLeaf(gp, p, leaf, idx) {
  return `lf:${encodeURIComponent(gp)}|${encodeURIComponent(p)}|${encodeURIComponent(leaf)}|${idx}`;
}

/**
 * @param {Record<string, unknown>[]} rowsInput
 * @param {import('./buildPartitionSeriesData.js').PartitionHierarchy} hierarchy
 * @returns {object[]}
 */
function buildOverviewSunburstData(rowsInput, hierarchy) {
  const rows = normalizeRows(rowsInput, hierarchy);
  if (!rows.length) {
    return [
      {
        id: 'empty',
        parent: '',
        name: 'No data',
        value: 1,
        color: '#e2e8f0',
        showInLegend: true,
      },
    ];
  }

  const total = sumValues(rows);
  const out = [];

  out.push({
    id: 'root',
    parent: '',
    name: 'Total',
    value: total,
    color: '#cbd5e1',
    showInLegend: false,
    custom: { level: 'root' },
  });

  const grandparents = uniqueOrdered(rows.map((r) => r.grandparent));
  grandparents.forEach((gp, gi) => {
    const gpRows = rows.filter((r) => r.grandparent === gp);
    const v = sumValues(gpRows);
    out.push({
      id: idGp(gp),
      parent: 'root',
      name: gp,
      value: v,
      color: gi === 0 ? '#7c3aed' : colorForParent(gp, gi),
      showInLegend: false,
      custom: { level: 'grandparent' },
    });
  });

  const parentPairs = uniqueGrandparentParentPairs(rows);

  parentPairs.forEach(({ gp, p }, pi) => {
    const pRows = rows.filter((r) => r.grandparent === gp && r.parent === p);
    const v = sumValues(pRows);
    out.push({
      id: idParent(gp, p),
      parent: idGp(gp),
      name: p,
      value: v,
      color: colorForParent(p, pi),
      showInLegend: false,
      custom: { level: 'parent', drillId: slugParent(p) },
    });
  });

  parentPairs.forEach(({ gp, p }) => {
    const pRows = rows.filter((x) => x.grandparent === gp && x.parent === p);
    pRows.forEach((r, j) => {
      out.push({
        id: idLeaf(gp, p, r.leaf, j),
        parent: idParent(gp, p),
        name: r.leaf,
        value: rowWeight(r),
        color: DMA_COLORS[j % DMA_COLORS.length],
        showInLegend: true,
        custom: {
          level: 'leaf',
          dmaIndex: j,
          leafKey: `${p}::${r.leaf}`,
          legendName: `${p} → ${r.leaf}`,
          rawRow: r.raw,
        },
      });
    });
  });

  return out;
}

/**
 * @param {Record<string, unknown>[]} rowsInput
 * @param {import('./buildPartitionSeriesData.js').PartitionHierarchy} hierarchy
 * @param {string} parentName
 */
function buildDrilledParentSunburstData(rowsInput, hierarchy, parentName) {
  const rows = normalizeRows(rowsInput, hierarchy);
  const slice = rows.filter((r) => r.parent === parentName);
  if (!slice.length) return buildOverviewSunburstData(rowsInput, hierarchy);

  const gp = slice[0].grandparent;
  const sub = sumValues(slice);

  return [
    {
      id: 'dr-root',
      parent: '',
      name: gp,
      value: sub,
      color: '#7c3aed',
      showInLegend: false,
      custom: { level: 'grandparent' },
    },
    {
      id: 'dr-parent',
      parent: 'dr-root',
      name: parentName,
      value: sub,
      color: colorForParent(parentName, 0),
      showInLegend: false,
      custom: { level: 'parent', drillId: slugParent(parentName) },
    },
    ...slice.map((r, j) => ({
      id: idLeaf(gp, parentName, r.leaf, j),
      parent: 'dr-parent',
      name: r.leaf,
      value: rowWeight(r),
      color: DMA_COLORS[j % DMA_COLORS.length],
      showInLegend: true,
      custom: {
        level: 'leaf',
        dmaIndex: j,
        leafKey: `${parentName}::${r.leaf}`,
        legendName: `${parentName} → ${r.leaf}`,
        rawRow: r.raw,
        drillId: slugParent(parentName),
      },
    })),
  ];
}

/**
 * @param {Record<string, unknown>[]} rowsInput
 * @param {import('./buildPartitionSeriesData.js').PartitionHierarchy} hierarchy
 * @param {string} parentName
 * @param {number} leafIndex
 */
function buildDrilledLeafSunburstData(rowsInput, hierarchy, parentName, leafIndex) {
  const rows = normalizeRows(rowsInput, hierarchy);
  const slice = rows.filter((r) => r.parent === parentName);
  const pick = slice[leafIndex];
  if (!pick) return buildDrilledParentSunburstData(rowsInput, hierarchy, parentName);

  const gp = pick.grandparent;
  const w = rowWeight(pick);

  return [
    {
      id: 'dl-root',
      parent: '',
      name: gp,
      value: w,
      color: '#7c3aed',
      showInLegend: true,
      custom: {
        level: 'grandparent',
        rowRole: 'total',
        legendName: `Region: ${gp}`,
      },
    },
    {
      id: 'dl-parent',
      parent: 'dl-root',
      name: parentName,
      value: w,
      color: colorForParent(parentName, 0),
      showInLegend: true,
      custom: {
        level: 'parent',
        rowRole: 'region',
        legendName: `Parent: ${parentName}`,
      },
    },
    {
      id: 'dl-leaf',
      parent: 'dl-parent',
      name: pick.leaf,
      value: w,
      color: DMA_COLORS[leafIndex % DMA_COLORS.length],
      showInLegend: true,
      custom: {
        level: 'leaf',
        dmaIndex: leafIndex,
        leafKey: `${parentName}::${pick.leaf}`,
        legendName: `${parentName} → ${pick.leaf}`,
        rawRow: pick.raw,
        rowRole: 'dmaLeaf',
      },
    },
  ];
}

/**
 * Same drill semantics as {@link import('./buildPartitionSeriesData.js').getPartitionData}.
 *
 * @param {Record<string, unknown>[]} rows
 * @param {import('./buildPartitionSeriesData.js').PartitionHierarchy} hierarchy
 * @param {string|null} drillParentName
 * @param {number|null} leafIndex
 */
export function getSunburstPartitionData(rows, hierarchy, drillParentName, leafIndex) {
  if (drillParentName == null) return buildOverviewSunburstData(rows, hierarchy);
  if (leafIndex != null) {
    return buildDrilledLeafSunburstData(rows, hierarchy, drillParentName, leafIndex);
  }
  return buildDrilledParentSunburstData(rows, hierarchy, drillParentName);
}
