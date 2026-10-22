import * as migration_20261022_225853_initial from './20261022_225853_initial';

export const migrations = [
  {
    up: migration_20261022_225853_initial.up,
    down: migration_20261022_225853_initial.down,
    name: '20261022_225853_initial'
  },
];
