import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { drilldownApi } from '../services/drilldownApi.js';
import drilldownReducer from '../features/drilldown/drilldownSlice.js';

export const store = configureStore({
  reducer: {
    drilldown: drilldownReducer,
    [drilldownApi.reducerPath]: drilldownApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(drilldownApi.middleware),
});

setupListeners(store.dispatch);
