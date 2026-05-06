/**
 * Two-level drill config aligned with `SAMPLE_DMA_PARTITION_ROWS`:
 * Region (parent) → DMA (leaf). Filter keys match row fields for mock API + icicle chart.
 */
export const DMA_DRILL_LEVELS = [
  { id: 'region', label: 'Region', variables: ['parent'] },
  { id: 'dma', label: 'DMA', variables: ['dma'] },
];
