import * as migration_20261022_233859_initial from './20261022_233859_initial';
import * as migration_20261028_100928_b2_shop from './20261028_100928_b2_shop';

export const migrations = [
  {
    up: migration_20261022_233859_initial.up,
    down: migration_20261022_233859_initial.down,
    name: '20261022_233859_initial',
  },
  {
    up: migration_20261028_100928_b2_shop.up,
    down: migration_20261028_100928_b2_shop.down,
    name: '20261028_100928_b2_shop'
  },
];
