import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

/** The Payload instance for tests. On first start it builds the tables in the test database. */
export function getTestPayload(): Promise<Payload> {
  return getPayload({ config })
}
