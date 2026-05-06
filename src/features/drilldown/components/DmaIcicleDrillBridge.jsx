import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import DmaPartitionChart from '../../partition/DmaPartitionChart.jsx';
import {
  applyIcicleDrillStateToRedux,
  pathToIcicleDrillState,
} from '../dmaIcicleDrillSync.js';
import { selectPath } from '../selectors.js';

/** Icicle chart wired to the same Redux drill path as DrilldownContainer cards/table. */
export function DmaIcicleDrillBridge({ rows, streamId, chartInstanceKey, levels }) {
  const dispatch = useDispatch();
  const path = useSelector(selectPath);

  const levelIds = useMemo(
    () => ({
      parentLevelId: levels[0].id,
      leafLevelId: levels[1].id,
    }),
    [levels]
  );

  const drillState = useMemo(
    () => pathToIcicleDrillState(path, rows, levelIds),
    [path, rows, levelIds]
  );

  const onDrillStateChange = useCallback(
    (next) => {
      applyIcicleDrillStateToRedux(dispatch, rows, next, path, levelIds);
    },
    [dispatch, levelIds, path, rows]
  );

  return (
    <DmaPartitionChart
      rows={rows}
      streamId={streamId}
      chartInstanceKey={chartInstanceKey}
      drillState={drillState}
      onDrillStateChange={onDrillStateChange}
      showBuiltInNav={false}
    />
  );
}

export default DmaIcicleDrillBridge;
