import { getPayload } from 'payload'

import config from '../payload.config'
import { assertSafeToSeed } from './guard'
import { seed } from './index'

assertSafeToSeed(process.env)

const payload = await getPayload({ config })
await seed(payload)
payload.logger.info(
  'Seed finished. Log in at /admin as admin@noisystreetss.test (admin-dev-password), editor@noisystreetss.test (editor-dev-password) or shop@noisystreetss.test (shop-dev-password).',
)
process.exit(0)
