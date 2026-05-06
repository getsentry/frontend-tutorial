import { isDmaDrillLevels } from '../utils.js';

const DISPLAY_ORDER = [
  'grandparent',
  'parent',
  'dma',
  'rank',
  'share',
  'spend',
  'impressions',
  'clicks',
  'conversions',
  'roi',
];

const HIDDEN = new Set(['id', 'rowKind']);

const formatCell = (key, value) => {
  if (value === undefined || value === null || value === '—') {
    return '—';
  }
  if (typeof value === 'number') {
    if (key === 'roi') {
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (key === 'share') {
      return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
    }
    if (key === 'rank') {
      return String(value);
    }
    return value.toLocaleString();
  }
  return String(value);
};

const columnLabel = (key) =>
  ({
    grandparent: 'Top',
    parent: 'Region',
    dma: 'DMA',
    rank: 'Rank',
    share: 'Share',
    spend: 'Spend',
    impressions: 'Impressions',
    clicks: 'Clicks',
    conversions: 'Conversions',
    roi: 'ROI',
  })[key] ?? key;

/**
 * Full rollup + DMA detail rows; highlights the row(s) matching the current drill `path`.
 */
const DmaAggregateMetricsTable = ({ rows, path, levels }) => {
  if (!isDmaDrillLevels(levels)) {
    return null;
  }

  if (!rows?.length) {
    return <p className="empty-state">No metrics available.</p>;
  }

  const regionStep = path.find((p) => p.levelId === 'region');
  const dmaStep = path.find((p) => p.levelId === 'dma');

  const keysPresent = new Set();
  rows.forEach((row) => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => {
        if (!HIDDEN.has(k)) {
          keysPresent.add(k);
        }
      });
    }
  });

  const columns = DISPLAY_ORDER.filter((k) => keysPresent.has(k));

  const rowClassName = (row) => {
    if (row.rowKind === 'rollup') {
      const matchRegion = regionStep && !dmaStep && row.parent === regionStep.value;
      return matchRegion ? 'data-row data-row--selected' : 'data-row data-row--rollup';
    }
    if (row.rowKind === 'detail' || !row.rowKind) {
      const matchDma =
        dmaStep &&
        regionStep &&
        row.dma === dmaStep.value &&
        row.parent === regionStep.value;
      return matchDma ? 'data-row data-row--selected' : 'data-row';
    }
    return 'data-row';
  };

  return (
    <table className="data-table data-table-aggregate">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {columnLabel(column)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const rk = row.id ?? `r-${index}`;
          const cn = rowClassName(row);
          const selected = cn.includes('data-row--selected');
          return (
            <tr key={rk} className={cn} aria-selected={selected}>
              {columns.map((column) => (
                <td key={`${rk}-${column}`}>{formatCell(column, row[column])}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DmaAggregateMetricsTable;
