/**
 * Field-agnostic partition / icicle series data for Highcharts xrange.
 * Each input row is one leaf segment; grandparent + parent + leaf column names come from `hierarchy`.
 */

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

export function slugParent(parent) {
  return `parent:${encodeURIComponent(parent)}`;
}

export function parseParentSlug(drillId) {
  if (!drillId || !String(drillId).startsWith('parent:')) return null;
  try {
    return decodeURIComponent(String(drillId).slice('parent:'.length));
  } catch {
    return null;
  }
}

export function rowWeight(r) {
  const n = Number(r.value);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * @typedef {object} PartitionHierarchy
 * @property {string} grandparent - Column key for top band (e.g. 'grandparent', 'region')
 * @property {string} parent - Column key for middle band
 * @property {string} leaf - Column key for leaf label (e.g. 'dma', 'sku')
 * @property {string} [value] - Optional numeric column for weights (defaults to weight 1 per row)
 */

/**
 * @param {Record<string, unknown>[]} rows
 * @param {PartitionHierarchy} hierarchy
 * @returns {{ grandparent: string, parent: string, leaf: string, value: number, raw: Record<string, unknown> }[]}
 */
export function normalizeRows(rows, hierarchy) {
  const gpKey = hierarchy.grandparent;
  const pKey = hierarchy.parent;
  const lKey = hierarchy.leaf;
  const vKey = hierarchy.value ?? 'value';

  return rows.map((r) => ({
    grandparent: String(r[gpKey] ?? 'Total'),
    parent: String(r[pKey]),
    leaf: String(r[lKey]),
    value: rowWeight({ value: r[vKey] }),
    raw: r,
  }));
}

function sumValues(list) {
  return list.reduce((s, r) => s + rowWeight(r), 0);
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

function pushLeafStrips(data, y, x0, x2, leafRows, drillParentKey) {
  const span = x2 - x0;
  const sub = sumValues(leafRows);
  let acc = x0;
  leafRows.forEach((r, j) => {
    const w = (rowWeight(r) / sub) * span;
    data.push({
      name: r.leaf,
      x: acc,
      x2: acc + w,
      y,
      color: DMA_COLORS[j % DMA_COLORS.length],
      custom: {
        dmaIndex: j,
        leafKey: `${r.parent}::${r.leaf}`,
        rawRow: r.raw,
        ...(drillParentKey != null ? { drillId: slugParent(drillParentKey) } : {}),
      },
      dataLabels: {
        rotation: -90,
        style: { fontSize: '0.62rem', fontWeight: '600' },
        crop: false,
        allowOverlap: true,
      },
    });
    acc += w;
  });
}

/**
 * @param {Record<string, unknown>[]} rowsInput
 * @param {PartitionHierarchy} hierarchy
 */
export function buildOverviewPartitionData(rowsInput, hierarchy) {
  const rows = normalizeRows(rowsInput, hierarchy);
  if (!rows.length) {
    return [{ name: 'No data', x: 0, x2: 100, y: 0, color: '#e2e8f0' }];
  }

  const total = sumValues(rows);
  const data = [];

  const grandparents = uniqueOrdered(rows.map((r) => r.grandparent));
  let x = 0;
  grandparents.forEach((gp, gi) => {
    const gpRows = rows.filter((r) => r.grandparent === gp);
    const gpSum = sumValues(gpRows);
    const w = (gpSum / total) * 100;
    data.push({
      name: gp,
      x,
      x2: x + w,
      y: 0,
      color: gi === 0 ? '#7c3aed' : colorForParent(gp, gi),
      custom: { level: 'grandparent' },
    });
    x += w;
  });

  const parents = uniqueOrdered(rows.map((r) => r.parent));
  x = 0;
  parents.forEach((p, pi) => {
    const pRows = rows.filter((r) => r.parent === p);
    const pSum = sumValues(pRows);
    const w = (pSum / total) * 100;
    data.push({
      name: p,
      x,
      x2: x + w,
      y: 1,
      color: colorForParent(p, pi),
      custom: { drillId: slugParent(p) },
    });
    x += w;
  });

  parents.forEach((p) => {
    const pRows = rows.filter((r) => r.parent === p);
    const parentBlock = data.find((d) => d.y === 1 && d.name === p);
    if (!parentBlock) return;
    pushLeafStrips(data, 2, parentBlock.x, parentBlock.x2, pRows, p);
  });

  return data;
}

/**
 * @param {Record<string, unknown>[]} rowsInput
 * @param {PartitionHierarchy} hierarchy
 * @param {string} parentName
 * @param {number|null} [leafIndex]
 */
export function buildDrilledPartitionData(
  rowsInput,
  hierarchy,
  parentName,
  leafIndex = null
) {
  const rows = normalizeRows(rowsInput, hierarchy);
  const slice = rows.filter((r) => r.parent === parentName);
  if (!slice.length) return buildOverviewPartitionData(rowsInput, hierarchy);

  const gp = slice[0].grandparent;

  if (leafIndex != null && leafIndex >= 0 && leafIndex < slice.length) {
    const pick = slice[leafIndex];
    const c = DMA_COLORS[leafIndex % DMA_COLORS.length];
    return [
      {
        name: gp,
        x: 0,
        x2: 100,
        y: 0,
        color: '#7c3aed',
        custom: { rowRole: 'total' },
      },
      {
        name: parentName,
        x: 0,
        x2: 100,
        y: 1,
        color: colorForParent(parentName, 0),
        custom: { rowRole: 'region' },
      },
      {
        name: pick.leaf,
        x: 0,
        x2: 100,
        y: 2,
        color: c,
        custom: {
          dmaIndex: leafIndex,
          rowRole: 'dmaLeaf',
          leafKey: `${pick.parent}::${pick.leaf}`,
          rawRow: pick.raw,
        },
      },
    ];
  }

  const data = [
    {
      name: gp,
      x: 0,
      x2: 100,
      y: 0,
      color: '#7c3aed',
      custom: { rowRole: 'total' },
    },
    {
      name: parentName,
      x: 0,
      x2: 100,
      y: 1,
      color: colorForParent(parentName, 0),
      custom: { rowRole: 'region' },
    },
  ];
  pushLeafStrips(data, 2, 0, 100, slice, parentName);
  return data;
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {PartitionHierarchy} hierarchy
 * @param {string|null} drillParentName
 * @param {number|null} leafIndex
 */
export function getPartitionData(rows, hierarchy, drillParentName, leafIndex) {
  if (drillParentName == null) return buildOverviewPartitionData(rows, hierarchy);
  return buildDrilledPartitionData(rows, hierarchy, drillParentName, leafIndex);
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {PartitionHierarchy} hierarchy
 * @param {string|null} drillParentName
 * @param {number|null} leafIndex
 */
export function leafLabel(rows, hierarchy, drillParentName, leafIndex) {
  if (drillParentName == null || leafIndex == null) return null;
  const slice = normalizeRows(rows, hierarchy).filter(
    (r) => r.parent === drillParentName
  );
  const r = slice[leafIndex];
  return r ? r.leaf : null;
}
