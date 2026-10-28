import type { CollectionConfig } from 'payload'

import { nobody } from '@/access'

/**
 * Event ids already handled, so a notice sent twice is acted on once. Server code only: rows are
 * written by recordEventOnce in src/shop/claims.ts, in the same transaction as the change they guard.
 */
export const WebhookEvents: CollectionConfig = {
  slug: 'webhook-events',
  labels: { singular: 'Webhook event', plural: 'Webhook events' },
  admin: { hidden: true },
  access: { read: nobody, create: nobody, update: nobody, delete: nobody },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'receivedAt', type: 'date', required: true },
  ],
}
