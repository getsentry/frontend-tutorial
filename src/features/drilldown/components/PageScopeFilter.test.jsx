import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { drilldownApi } from '../../../services/drilldownApi.js';
import drilldownReducer, { setLevels } from '../drilldownSlice.js';
import { DMA_DRILL_LEVELS } from '../../../mocks/dmaDrilldownLevels.js';
import PageScopeFilter from './PageScopeFilter.jsx';

const makeStore = () =>
  configureStore({
    reducer: {
      drilldown: drilldownReducer,
      [drilldownApi.reducerPath]: drilldownApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(drilldownApi.middleware),
  });

describe('PageScopeFilter', () => {
  it('opens a floating panel with search and DMA controls', () => {
    const store = makeStore();
    store.dispatch(setLevels(DMA_DRILL_LEVELS));

    render(
      <Provider store={store}>
        <PageScopeFilter />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /DMA scope/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /DMA scope/i }));

    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('narrows selection when unchecking All and restores when checking again', () => {
    const store = makeStore();
    store.dispatch(setLevels(DMA_DRILL_LEVELS));

    render(
      <Provider store={store}>
        <PageScopeFilter />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /DMA scope/i }));

    const all = screen.getByRole('checkbox', { name: /^All$/i });
    fireEvent.click(all);
    expect(store.getState().drilldown.globalDatasetFilters.selectedDmas).toEqual([]);

    fireEvent.click(all);
    expect(store.getState().drilldown.globalDatasetFilters.selectedDmas).toBeNull();
  });

  it('filters the list when searching', () => {
    const store = makeStore();
    store.dispatch(setLevels(DMA_DRILL_LEVELS));

    render(
      <Provider store={store}>
        <PageScopeFilter />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /DMA scope/i }));

    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'zzznomatch' },
    });
    expect(screen.getByText(/No regions or DMAs match your search/i)).toBeInTheDocument();
  });
});
