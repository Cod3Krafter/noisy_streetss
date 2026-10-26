import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          // No database, so no globalSetup: these run without Docker.
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/unit/**/*.spec.ts'],
          testTimeout: 30_000,
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          // Empties the test database once before the integration files run.
          globalSetup: ['./tests/globalSetup.ts'],
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/int/**/*.spec.ts'],
          // One database, so one test file at a time.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
    ],
  },
})
