import type { PayloadRequest } from 'payload'

import { withOrderLock } from '@/shop/claims'
import { appendHistory } from '@/shop/history'
import { markPaid } from '@/shop/markPaid'
import { findOrder, serverUpdate } from '@/shop/orders'
import { PaystackError } from '@/shop/paystack'

/** How many times the expiry job tries again, 5 minutes apart, when Paystack can't be reached. */
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
    // Only a Paystack outage is absorbed, and only on the last try: any other failure may follow a confirmed payment.
    if (!(error instanceof PaystackError) || triesSoFar < EXPIRY_RETRIES) throw error
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

/** How long an Expired order keeps the customer's details. */
export const DETAILS_KEPT_DAYS = 30

/** The most orders one run of the details removal looks at. Any left over wait for the next day's run. */
export const DETAILS_REMOVED_PER_RUN = 200

/**
 * Empties the name, email, phone and street lines on orders Expired for more than 30 days, keeping
 * the city, state, items and totals. Nigeria's Data Protection Act 2023 expects personal data to be
 * kept no longer than its purpose needs, and an unpaid order has none left. Returns how many it cleaned.
 *
 * At most 200 orders a run, the longest expired first. One order that fails is logged and skipped,
 * so it never stops the others being cleaned; once the rest are done the run throws one error
 * naming every order that failed, so the job still shows the failure, and the next run tries them again.
 *
 * Call it with a req that is not already inside a transaction: each order's lock commits or rolls back on
 * its own, and inside an outer transaction one failure would roll back the orders already cleaned.
 */
export async function removeExpiredDetails(req: PayloadRequest, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - DETAILS_KEPT_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { docs } = await req.payload.find({
    collection: 'orders',
    where: { and: [{ status: { equals: 'expired' } }, { expiresAt: { less_than: cutoff } }, { detailsRemovedAt: { exists: false } }] },
    depth: 0,
    limit: DETAILS_REMOVED_PER_RUN,
    pagination: false,
    sort: 'expiresAt',
    overrideAccess: true,
    req,
  })
  let cleaned = 0
  const failed: string[] = []
  // One order at a time: each lock opens and commits its own transaction on this request, and a
  // failure rolls back only that order's transaction.
  for (const candidate of docs) {
    try {
      const done = await withOrderLock(req, candidate.id, async () => {
        // Re-read under the lock: a long-Expired order can still be paid late by Paystack's webhook.
        const order = await findOrder(req, candidate.id)
        if (!order || order.status !== 'expired' || order.detailsRemovedAt) return false
        if (!order.expiresAt || order.expiresAt >= cutoff) return false
        await serverUpdate(req, order.id, {
          customerName: null,
          customerEmail: null,
          customerPhone: null,
          address: { ...order.address, line1: null, line2: null, postcode: null },
          detailsRemovedAt: now.toISOString(),
          history: appendHistory(order.history, {
            by: 'Data clean-up',
            note: `Customer details removed ${DETAILS_KEPT_DAYS} days after the order expired`,
          }),
        })
        return true
      })
      if (done) cleaned += 1
    } catch (error) {
      const name = candidate.orderNumber ?? `order ${candidate.id}`
      req.payload.logger.error({ err: error, msg: `Customer details could not be removed from ${name}. The other orders carry on.` })
      failed.push(name)
    }
  }
  if (failed.length > 0) throw new Error(`Customer details could not be removed from ${failed.join(', ')}. The next daily run tries again.`)
  return cleaned
}
