import type { TaskConfig } from 'payload'

import { SHOP_EMAIL_KINDS, sendShopEmail, type ShopEmailInput } from '@/shop/emails'
import { EXPIRY_RETRIES, expireOrder } from '@/shop/expiry'

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

export const expireOrderTask: TaskConfig<{ input: { orderId: number }; output: object }> = {
  slug: 'expireOrder',
  label: 'Expire an unpaid order',
  retries: EXPIRY_RETRIES,
  inputSchema: [{ name: 'orderId', type: 'number', required: true }],
  handler: async ({ input, job, req }) => {
    await expireOrder(req, input.orderId, job.totalTried ?? 0)
    return { output: {} }
  },
}
