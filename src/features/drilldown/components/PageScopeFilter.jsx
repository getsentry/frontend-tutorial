import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setGlobalDatasetFilters } from '../drilldownSlice.js';
import { selectGlobalDatasetFilters } from '../selectors.js';
import { buildDmaRegionTree, getAllDmaKeys } from '../dmaPageScopeTree.js';

function dmaIncluded(selectedDmas, dma) {
  if (selectedDmas == null) {
    return true;
  }
  return selectedDmas.includes(dma);
}

/**
 * Page-level DMA multi-select (regions + DMAs + search). Drives `globalDatasetFilters.selectedDmas`
 * (`null` = all DMAs; non-null array = explicit inclusion).
 */
const PageScopeFilter = () => {
  const dispatch = useDispatch();
  const globalDatasetFilters = useSelector(selectGlobalDatasetFilters);
  const selectedDmas = globalDatasetFilters.selectedDmas;

  const allKeys = useMemo(() => getAllDmaKeys(), []);
  const tree = useMemo(() => buildDmaRegionTree(), []);

  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openRegions, setOpenRegions] = useState(
    () => new Set(tree.map((r) => r.regionLabel))
  );

  useEffect(() => {
    if (!panelOpen) {
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPanelOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const setSelection = (nextSelected) => {
    dispatch(
      setGlobalDatasetFilters({
        ...globalDatasetFilters,
        selectedDmas: nextSelected,
      })
    );
  };

  const toggleDma = (dma) => {
    const keys = allKeys;
    if (selectedDmas == null) {
      const next = keys.filter((k) => k !== dma);
      setSelection(next.length === 0 ? [] : next);
      return;
    }
    if (selectedDmas.includes(dma)) {
      const next = selectedDmas.filter((d) => d !== dma);
      setSelection(next.length === 0 ? [] : next);
    } else {
      const next = [...selectedDmas, dma].sort((a, b) => a.localeCompare(b));
      if (next.length === keys.length) {
        setSelection(null);
      } else {
        setSelection(next);
      }
    }
  };

  const toggleRegion = (region) => {
    const regionDmas = region.dmas.map((d) => d.dma);
    const allInRegionSelected =
      selectedDmas == null || regionDmas.every((d) => selectedDmas.includes(d));

    if (allInRegionSelected) {
      if (selectedDmas == null) {
        const next = allKeys.filter((k) => !regionDmas.includes(k));
        setSelection(next.length === 0 ? [] : next);
      } else {
        const next = selectedDmas.filter((d) => !regionDmas.includes(d));
        setSelection(next.length === 0 ? [] : next);
      }
      return;
    }

    const base = selectedDmas == null ? [...allKeys] : [...selectedDmas];
    const set = new Set(base);
    regionDmas.forEach((d) => set.add(d));
    const merged = [...set].sort((a, b) => a.localeCompare(b));
    setSelection(merged.length === allKeys.length ? null : merged);
  };

  const toggleAll = () => {
    if (selectedDmas == null) {
      setSelection([]);
    } else {
      setSelection(null);
    }
  };

  const searchLower = search.trim().toLowerCase();
  const filteredTree = useMemo(() => {
    if (!searchLower) {
      return tree;
    }
    return tree
      .map((region) => {
        const regionMatch = region.regionLabel.toLowerCase().includes(searchLower);
        const dmas = region.dmas.filter(
          (d) => regionMatch || d.dma.toLowerCase().includes(searchLower)
        );
        return { ...region, dmas };
      })
      .filter((region) => region.dmas.length > 0);
  }, [tree, searchLower]);

  const visibleDmaCount = filteredTree.reduce((n, r) => n + r.dmas.length, 0);
  const selectedCount =
    selectedDmas == null
      ? allKeys.length
      : selectedDmas.filter((d) => allKeys.includes(d)).length;

  const allSelected = selectedDmas == null;
  const noneSelected = Array.isArray(selectedDmas) && selectedDmas.length === 0;

  return (
    <div
      className={`page-scope-filter-root${panelOpen ? ' page-scope-filter-root--open' : ''}`}
    >
      <button
        type="button"
        className="page-scope-filter__toggle"
        aria-expanded={panelOpen}
        aria-controls="dma-scope-popover"
        onClick={() => setPanelOpen((o) => !o)}
      >
        <span className="page-scope-filter__toggle-text">DMA scope</span>
        <span className="page-scope-filter__toggle-summary muted">
          {selectedCount}/{allKeys.length}
        </span>
        <span className="page-scope-filter__toggle-chevron" aria-hidden>
          {panelOpen ? '▾' : '▸'}
        </span>
      </button>

      {panelOpen ? (
        <>
          <button
            type="button"
            className="page-scope-filter__backdrop"
            tabIndex={-1}
            aria-label="Close DMA scope"
            onClick={() => setPanelOpen(false)}
          />
          <section
            id="dma-scope-popover"
            className="page-scope-filter page-scope-filter--popover"
            aria-label="DMA scope options"
          >
            <div className="page-scope-filter__search">
              <label className="visually-hidden" htmlFor="dma-scope-search">
                Search DMAs or regions
              </label>
              <input
                id="dma-scope-search"
                type="search"
                className="page-scope-filter__search-input"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              <span className="page-scope-filter__search-icon" aria-hidden>
                ⌕
              </span>
            </div>

            <div className="page-scope-filter__toolbar">
              <label className="page-scope-filter__all">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                <span>All</span>
              </label>
              <span className="page-scope-filter__counts muted">
                {selectedCount}/{allKeys.length} DMAs
                {noneSelected ? ' (no data — select at least one DMA)' : ''}
              </span>
            </div>

            <ul className="page-scope-filter__regions">
              {filteredTree.map((region) => {
                const open = openRegions.has(region.regionLabel);
                const regionDmas = region.dmas.map((d) => d.dma);
                const regionSelected =
                  selectedDmas == null ||
                  (regionDmas.length > 0 &&
                    regionDmas.every((d) => selectedDmas.includes(d)));
                const regionCount = `${regionDmas.filter((d) => dmaIncluded(selectedDmas, d)).length}/${regionDmas.length}`;

                return (
                  <li key={region.regionLabel} className="page-scope-filter__region">
                    <div className="page-scope-filter__region-head">
                      <button
                        type="button"
                        className="page-scope-filter__chevron"
                        aria-expanded={open}
                        onClick={() => {
                          setOpenRegions((prev) => {
                            const next = new Set(prev);
                            if (next.has(region.regionLabel)) {
                              next.delete(region.regionLabel);
                            } else {
                              next.add(region.regionLabel);
                            }
                            return next;
                          });
                        }}
                      >
                        {open ? '▾' : '▸'}
                      </button>
                      <label className="page-scope-filter__region-label">
                        <input
                          type="checkbox"
                          checked={regionSelected && !noneSelected}
                          onChange={() => toggleRegion(region)}
                        />
                        <span>{region.regionLabel}</span>
                        <span className="page-scope-filter__region-meta muted">
                          {regionCount} DMAs
                        </span>
                      </label>
                    </div>
                    {open ? (
                      <ul className="page-scope-filter__dma-list">
                        {region.dmas.map(({ dma }) => {
                          const checked = dmaIncluded(selectedDmas, dma);
                          return (
                            <li key={`${region.regionLabel}-${dma}`}>
                              <label className="page-scope-filter__dma">
                                <input
                                  type="checkbox"
                                  checked={checked && !noneSelected}
                                  onChange={() => toggleDma(dma)}
                                />
                                <span>{dma}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {visibleDmaCount === 0 ? (
              <p className="empty-state muted">No regions or DMAs match your search.</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
};

export default PageScopeFilter;
