import { applyTestEnvironment } from './env'

// Runs in each test worker before any test file is imported,
// so the Payload config reads the test settings.
applyTestEnvironment()
