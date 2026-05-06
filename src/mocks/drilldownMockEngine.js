import { SAMPLE_DMA_PARTITION_ROWS } from './dmaPartitionSampleData.js';
import { stableSerialize } from '../features/drilldown/utils.js';

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Partition rows for the icicle chart and DMA mock cards/table — same shape, scaled per dataset scope.
 */
export const getPartitionRowsForDataset = (dataset = {}) => {
  const { selectedDmas, ...datasetForScale } = dataset ?? {};
  const scaleSig = stableSerialize(datasetForScale);
  let rows;
  if (scaleSig === '{}' || scaleSig === stableSerialize({ scope: 'default' })) {
    rows = SAMPLE_DMA_PARTITION_ROWS;
  } else {
    const factor = 0.9 + (hashString(scaleSig) % 21) / 100;
    rows = SAMPLE_DMA_PARTITION_ROWS.map((r) => ({
      ...r,
      value: Number(r.value) * factor,
    }));
  }

  if (selectedDmas == null) {
    return rows;
  }
  if (Array.isArray(selectedDmas) && selectedDmas.length === 0) {
    return [];
  }
  const allow = new Set(selectedDmas.map(String));
  return rows.filter((r) => allow.has(String(r.dma)));
};

const filterSignature = (filters) => stableSerialize(filters ?? {});

const buildMetric = (seed, min, range) => min + (hashString(seed) % range);

const isDmaLevel = (levelId) => levelId === 'region' || levelId === 'dma';

const buildDmaCards = ({ levelId, filters, dataset = {} }) => {
  const rows = getPartitionRowsForDataset(dataset);
  if (levelId === 'region') {
    const parents = [...new Set(rows.map((r) => r.parent))];
    return parents.map((label, index) => {
      const vol = rows
        .filter((r) => r.parent === label)
        .reduce((s, r) => s + (Number(r.value) || 1), 0);
      return {
        id: `dma-region-${index}`,
        label,
        metric: Math.round(vol * 1000) / 1000,
        valueMetric: vol,
      };
    });
  }
  if (levelId === 'dma') {
    const parent = filters.parent;
    if (!parent) {
      return [];
    }
    return rows
      .filter((r) => r.parent === parent)
      .map((r, index) => ({
        id: `dma-leaf-${index}-${r.dma}`,
        label: r.dma,
        metric: Math.round(Number(r.value) * 1000) / 1000,
        dma: r.dma,
        parent: r.parent,
      }));
  }
  return [];
};

const buildDmaTableRows = ({ filters, dataset = {} }) => {
  let data = [...getPartitionRowsForDataset(dataset)];
  if (filters.parent) {
    data = data.filter((r) => r.parent === filters.parent);
  }
  if (filters.dma) {
    data = data.filter((r) => r.dma === filters.dma);
  }
  const signature = filterSignature(filters);
  return data.map((r, rank) => {
    const rowSeed = `dma-${r.parent}-${r.dma}-${signature}-${rank}`;
    return {
      id: `dma-t-${rank}`,
      rank: rank + 1,
      parent: r.parent,
      dma: r.dma,
      grandparent: r.grandparent,
      share: r.value,
      spend: buildMetric(`${rowSeed}-spend`, 500, 60000),
      impressions: buildMetric(`${rowSeed}-imp`, 50000, 950000),
      clicks: buildMetric(`${rowSeed}-clk`, 1000, 60000),
      conversions: buildMetric(`${rowSeed}-conv`, 50, 4500),
      roi: Number((buildMetric(`${rowSeed}-roi`, 80, 350) / 100).toFixed(2)),
    };
  });
};

const sumSpendWeightedRoi = (rows) => {
  const spendSum = rows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
  if (spendSum <= 0) {
    return 0;
  }
  const weighted = rows.reduce(
    (s, r) => s + (Number(r.roi) || 0) * (Number(r.spend) || 0),
    0
  );
  return Number((weighted / spendSum).toFixed(2));
};

/**
 * Full hierarchy: per-region rollup row (sums of leaf metrics) then leaf DMA rows.
 * Used for the summary table with selection highlight (path) while cards stay in sync.
 */
export const buildDmaAggregateTableRows = (dataset = {}) => {
  const detail = buildDmaTableRows({ filters: {}, dataset });
  const order = [];
  const seen = new Set();
  for (const r of getPartitionRowsForDataset(dataset)) {
    if (!seen.has(r.parent)) {
      seen.add(r.parent);
      order.push(r.parent);
    }
  }

  const out = [];
  for (const parent of order) {
    const rows = detail.filter((d) => d.parent === parent);
    if (!rows.length) {
      continue;
    }
    const share = rows.reduce((s, r) => s + Number(r.share ?? 0), 0);
    const spend = rows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
    const impressions = rows.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
    const clicks = rows.reduce((s, r) => s + (Number(r.clicks) || 0), 0);
    const conversions = rows.reduce((s, r) => s + (Number(r.conversions) || 0), 0);

    out.push({
      id: `rollup-${parent}`,
      rowKind: 'rollup',
      grandparent: rows[0]?.grandparent ?? '—',
      parent,
      dma: '—',
      rank: '—',
      share,
      spend: Math.round(spend),
      impressions: Math.round(impressions),
      clicks: Math.round(clicks),
      conversions: Math.round(conversions),
      roi: sumSpendWeightedRoi(rows),
    });
    rows.forEach((r) => out.push({ ...r, rowKind: 'detail' }));
  }
  return out;
};

export const shouldUseMockData = () =>
  import.meta.env.VITE_USE_DRILLDOWN_MOCKS !== 'false';

export const getMockCards = ({ levelId, filters = {}, dataset = {} }) => {
  if (isDmaLevel(levelId)) {
    return buildDmaCards({ levelId, filters, dataset });
  }
  return [];
};

export const getMockTable = ({ levelId, filters = {}, dataset = {} }) => {
  if (isDmaLevel(levelId)) {
    return buildDmaTableRows({ levelId, filters, dataset });
  }
  return [];
};
