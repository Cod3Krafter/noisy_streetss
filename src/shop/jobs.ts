import type { TaskConfig } from 'payload'

import { SHOP_EMAIL_KINDS, sendShopEmail, type ShopEmailInput } from '@/shop/emails'
import { EXPIRY_RETRIES, expireOrder, removeExpiredDetails } from '@/shop/expiry'

export const sendShopEmailTask: TaskConfig<{ input: ShopEmailInput; output: object }> = {
  slug: 'sendShopEmail',
  label: 'Send a shop email',
  retries: 3,
  inputSchema: [
    { name: 'kind', type: 'select', required: true, options: [...SHOP_EMAIL_KINDS] },
    { name: 'orderId', type: 'number', required: true },
    { name: 'details', type: 'text' },
  ],
  handler: async ({ input, req }) => {
    await sendShopEmail(req, input)
    return { output: {} }
  },
}

export const expireOrderTask: TaskConfig<{ input: { orderId: number }; output: { result: 'paid' | 'expired' | 'unchanged' } }> = {
  slug: 'expireOrder',
  label: 'Expire an unpaid order',
  // Five minutes between tries, so a short Paystack outage has passed before the order is expired anyway.
  retries: { attempts: EXPIRY_RETRIES, backoff: { type: 'fixed', delay: 5 * 60_000 } },
  inputSchema: [{ name: 'orderId', type: 'number', required: true }],
  handler: async ({ input, job, req }) => ({ output: { result: await expireOrder(req, input.orderId, job.totalTried ?? 0) } }),
}

export const removeExpiredDetailsTask: TaskConfig<{ input: object; output: { removed: number } }> = {
  slug: 'removeExpiredDetails',
  label: 'Remove customer details from long-expired orders',
  retries: 1,
  // Daily at 03:00 server time. Vercel Cron's call to /api/payload-jobs/run also queues scheduled tasks.
  schedule: [{ cron: '0 0 3 * * *', queue: 'default' }],
  handler: async ({ req }) => ({ output: { removed: await removeExpiredDetails(req) } }),
}
