export const MAX_LEVELS = 5;

/** Region → DMA drill config aligned with partition sample data and icicle bridge. */
export const isDmaDrillLevels = (levels) =>
  Array.isArray(levels) &&
  levels.length === 2 &&
  levels[0]?.id === 'region' &&
  levels[1]?.id === 'dma';

/**
 * Admin level configuration: array order is the drill hierarchy (depth 0 → n).
 * Levels are interchangeable—reordering the array changes which dimension is explored first,
 * without any hardcoded level ids or names in application logic.
 */
export const normalizeLevels = (levels) => {
  if (!Array.isArray(levels)) {
    return [];
  }

  return levels
    .slice(0, MAX_LEVELS)
    .filter((level) => level && level.id && Array.isArray(level.variables))
    .map((level) => ({
      id: String(level.id),
      label: String(level.label ?? level.id),
      variables: level.variables.map(String),
    }));
};

export const buildSelectionsFromPath = (path) => {
  const selections = {};
  path.forEach(({ levelId, value }) => {
    selections[levelId] = value;
  });
  return selections;
};

export const buildFiltersFromPath = ({ levels, path, upToLevelIndex }) => {
  if (!Array.isArray(levels) || !Array.isArray(path) || upToLevelIndex < 0) {
    return {};
  }

  const levelMap = Object.fromEntries(levels.map((level) => [level.id, level]));
  const boundedPath = path.slice(0, upToLevelIndex + 1);

  return boundedPath.reduce((acc, step) => {
    const level = levelMap[step.levelId];
    if (!level) {
      return acc;
    }
    level.variables.forEach((variable) => {
      acc[variable] = step.value;
    });
    return acc;
  }, {});
};

export const stableSortObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(stableSortObject);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSortObject(value[key]);
        return acc;
      }, {});
  }
  return value;
};

export const stableSerialize = (value) => JSON.stringify(stableSortObject(value));

export const normalizeCardsResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.items)) {
    return response.items;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
};

export const normalizeTableResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.rows)) {
    return response.rows;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  return [];
};

export const getItemLabel = (item) =>
  item?.label ?? item?.name ?? item?.title ?? item?.value ?? item?.id ?? 'Unknown';

export const getItemMetric = (item) =>
  item?.metric ?? item?.count ?? item?.valueMetric ?? null;

/** Union of row object keys, sorted, for dynamic table columns. */
export const collectTableColumnKeys = (rows) => {
  const keys = new Set();
  if (!Array.isArray(rows)) {
    return [];
  }
  rows.forEach((row) => {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((key) => keys.add(key));
    }
  });
  return Array.from(keys).sort();
};

/** Stable signature for one row at a level (uses that level’s variables on the row). */
export const getRowSignatureForLevel = (row, level) => {
  if (!row || !level?.variables?.length) {
    return '—';
  }
  const parts = level.variables
    .map((key) => row[key])
    .filter((v) => v !== undefined && v !== null);
  return parts.length ? parts.map(String).join(' · ') : '—';
};

/**
 * Sort rows by admin level order, then emit group headers + data rows for the summary table.
 */
export const buildGroupedTableSegments = (rows, levels) => {
  if (!Array.isArray(rows) || !rows.length || !Array.isArray(levels) || !levels.length) {
    return [];
  }

  const sorted = [...rows].sort((a, b) => {
    for (const level of levels) {
      const sa = getRowSignatureForLevel(a, level);
      const sb = getRowSignatureForLevel(b, level);
      if (sa < sb) return -1;
      if (sa > sb) return 1;
    }
    return 0;
  });

  const segments = [];
  const prev = levels.map(() => null);

  for (const row of sorted) {
    for (let d = 0; d < levels.length; d += 1) {
      const sig = getRowSignatureForLevel(row, levels[d]);
      if (prev[d] !== sig) {
        for (let j = d + 1; j < levels.length; j += 1) {
          prev[j] = null;
        }
        prev[d] = sig;
        segments.push({
          kind: 'group',
          depth: d,
          levelLabel: levels[d].label,
          value: sig,
        });
      }
    }
    segments.push({ kind: 'row', row });
  }

  return segments;
};
