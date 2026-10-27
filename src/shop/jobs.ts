import type { TaskConfig } from 'payload'

import { SHOP_EMAIL_KINDS, sendShopEmail, type ShopEmailInput } from '@/shop/emails'

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
