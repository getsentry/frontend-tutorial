import { useId, useState } from 'react';

import { PartitionIcicleChart } from '../../components/common/partition/PartitionIcicleChart.jsx';
import { PartitionSunburstChart } from '../../components/common/partition/PartitionSunburstChart.jsx';

import { DEFAULT_DMA_HIERARCHY } from './dmaPartitionModel';

/**
 * Domain preset: DMA columns (`dma`, `parent`, `grandparent`, optional `value`).
 * For arbitrary column names use `PartitionIcicleChart` / `PartitionSunburstChart` with a custom `hierarchy`.
 *
 * @param {'icicle'|'sunburst'} [props.defaultView='icicle']
 * @param {boolean} [props.showViewToggle=true]
 */
export function DmaPartitionChart({
  rows,
  chartInstanceKey,
  defaultView = 'icicle',
  showViewToggle = true,
  ...rest
}) {
  const toggleGroupId = useId();
  const [view, setView] = useState(defaultView === 'sunburst' ? 'sunburst' : 'icicle');

  const baseKey = chartInstanceKey ?? 'dma-partition';
  const icicleKey = `${baseKey}-icicle`;
  const sunburstKey = `${baseKey}-sunburst`;

  const common = {
    data: rows,
    hierarchy: DEFAULT_DMA_HIERARCHY,
    chartTitle: 'DMA partition chart',
    captionText:
      'Data: flat DMA rows with parent + grandparent; layout is inferred (same weights in icicle and sunburst).',
    ...rest,
  };

  return (
    <div className="dma-partition-chart">
      {showViewToggle ? (
        <div
          className="partition-view-toggle"
          role="group"
          aria-labelledby={`${toggleGroupId}-label`}
        >
          <span id={`${toggleGroupId}-label`} className="partition-view-toggle__label">
            View
          </span>
          <div className="partition-view-toggle__buttons">
            <button
              type="button"
              className="partition-view-toggle__btn"
              aria-pressed={view === 'icicle'}
              onClick={() => setView('icicle')}
            >
              Icicle
            </button>
            <button
              type="button"
              className="partition-view-toggle__btn"
              aria-pressed={view === 'sunburst'}
              onClick={() => setView('sunburst')}
            >
              Sunburst
            </button>
          </div>
        </div>
      ) : null}

      {view === 'icicle' ? (
        <PartitionIcicleChart chartInstanceKey={icicleKey} {...common} />
      ) : (
        <PartitionSunburstChart chartInstanceKey={sunburstKey} {...common} />
      )}
    </div>
  );
}

export default DmaPartitionChart;
