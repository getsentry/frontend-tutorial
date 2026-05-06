import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { drilldownApi } from '../../../services/drilldownApi.js';
import drilldownReducer from '../drilldownSlice.js';
import { DMA_DRILL_LEVELS } from '../../../mocks/dmaDrilldownLevels.js';

vi.mock('./DmaIcicleDrillBridge.jsx', () => ({
  default: () => <div data-testid="dma-icicle-bridge-mock" />,
}));

import DrilldownContainer from './DrilldownContainer.jsx';

const makeStore = () =>
  configureStore({
    reducer: {
      drilldown: drilldownReducer,
      [drilldownApi.reducerPath]: drilldownApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(drilldownApi.middleware),
  });

describe('DrilldownContainer', () => {
  it('uses Region as the first level for the DMA drill config', async () => {
    const store = makeStore();

    render(
      <Provider store={store}>
        <DrilldownContainer config={DMA_DRILL_LEVELS} />
      </Provider>
    );

    expect(await screen.findByText(/Region — explore/)).toBeInTheDocument();
  });
});
