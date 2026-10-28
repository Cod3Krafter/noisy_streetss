import type { PayloadRequest } from 'payload'

import { withOrderLock } from '@/shop/claims'
import { appendHistory } from '@/shop/history'
import { markPaid } from '@/shop/markPaid'
import { findOrder, serverUpdate } from '@/shop/orders'

/** How many times the expiry job tries again when Paystack can't be reached. */
export const EXPIRY_RETRIES = 2

/**
 * Runs when an unpaid order's 30 minutes are up. Paystack is asked once more first, because many
 * bank-transfer payers never come back to the site. If Paystack can't be reached, the job tries
 * again; after the last try the order expires anyway, and a payment found later still marks it Paid.
 */
export async function expireOrder(req: PayloadRequest, orderId: number, triesSoFar: number): Promise<'paid' | 'expired' | 'unchanged'> {
  const order = await findOrder(req, orderId)
  if (!order || order.status !== 'awaiting-payment') return 'unchanged'
  try {
    const result = await markPaid(req, order.payment?.reference ?? '', 'Expiry check')
    if (result === 'paid' || result === 'paid-late') return 'paid'
  } catch (error) {
    if (triesSoFar < EXPIRY_RETRIES) throw error
    req.payload.logger.warn({ err: error, msg: `Paystack could not be asked about ${order.orderNumber} before it expired.` })
  }
  // Re-read under the lock: the order may have been paid, or changed, since it was first read.
  return withOrderLock(req, order.id, async () => {
    const fresh = await findOrder(req, order.id)
    if (!fresh || fresh.status !== 'awaiting-payment') return 'unchanged'
    await serverUpdate(req, fresh.id, {
      status: 'expired',
      history: appendHistory(fresh.history, { from: 'awaiting-payment', to: 'expired', by: 'Expiry check' }),
    })
    return 'expired'
  })
}
