/**
 * Sample DMA hierarchy: each row is one DMA; `parent` and `grandparent` define the
 * middle and top rows. `value` drives horizontal share (within the full dataset).
 *
 * Weights chosen so parent bands approximate the reference layout: National ~42%,
 * North ~16%, South ~17%, Central ~25% (sums to 100 at parent level).
 */
const NORTH_SCALE = 16 / 100;

export const SAMPLE_DMA_PARTITION_ROWS = [
  {
    dma: 'Boston',
    parent: 'North region',
    grandparent: 'Total',
    value: 18 * NORTH_SCALE,
  },
  {
    dma: 'Washington',
    parent: 'North region',
    grandparent: 'Total',
    value: 6 * NORTH_SCALE,
  },
  {
    dma: 'Philadelphia',
    parent: 'North region',
    grandparent: 'Total',
    value: 7 * NORTH_SCALE,
  },
  {
    dma: 'Hartford',
    parent: 'North region',
    grandparent: 'Total',
    value: 4 * NORTH_SCALE,
  },
  {
    dma: 'Tallahassee',
    parent: 'North region',
    grandparent: 'Total',
    value: 4 * NORTH_SCALE,
  },
  {
    dma: 'Baltimore',
    parent: 'North region',
    grandparent: 'Total',
    value: 6 * NORTH_SCALE,
  },
  {
    dma: 'Springfield',
    parent: 'North region',
    grandparent: 'Total',
    value: 5 * NORTH_SCALE,
  },
  { dma: 'Albany', parent: 'North region', grandparent: 'Total', value: 4 * NORTH_SCALE },
  {
    dma: 'New York',
    parent: 'North region',
    grandparent: 'Total',
    value: 10 * NORTH_SCALE,
  },
  {
    dma: 'Los Angeles',
    parent: 'North region',
    grandparent: 'Total',
    value: 7 * NORTH_SCALE,
  },
  { dma: 'Tampa', parent: 'North region', grandparent: 'Total', value: 6 * NORTH_SCALE },
  {
    dma: 'Orlando',
    parent: 'North region',
    grandparent: 'Total',
    value: 5 * NORTH_SCALE,
  },
  {
    dma: 'Atlanta',
    parent: 'North region',
    grandparent: 'Total',
    value: 6 * NORTH_SCALE,
  },
  { dma: 'Miami', parent: 'North region', grandparent: 'Total', value: 5 * NORTH_SCALE },
  {
    dma: 'All other DMAs',
    parent: 'North region',
    grandparent: 'Total',
    value: 7 * NORTH_SCALE,
  },

  { dma: 'Coastal', parent: 'South region', grandparent: 'Total', value: 7 },
  { dma: 'Inland', parent: 'South region', grandparent: 'Total', value: 6 },
  { dma: 'Other South', parent: 'South region', grandparent: 'Total', value: 4 },

  { dma: 'Metro West', parent: 'Central region', grandparent: 'Total', value: 14 },
  { dma: 'Metro East', parent: 'Central region', grandparent: 'Total', value: 11 },

  { dma: 'National', parent: 'National', grandparent: 'Total', value: 42 },
];
