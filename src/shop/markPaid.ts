import type { PayloadRequest } from 'payload'

import type { Order } from '@/payload-types'
import { withOrderLock } from '@/shop/claims'
import { shopClients } from '@/shop/clients'
import { queueShopEmail } from '@/shop/emails'
import { appendHistory } from '@/shop/history'
import { formatNaira, toKobo, toNaira } from '@/shop/money'
import { findOrder, findOrderByReference, serverUpdate } from '@/shop/orders'
import type { PaystackTransaction } from '@/shop/paystack'

export type MarkPaidResult = 'paid' | 'paid-late' | 'unchanged' | 'not-paid' | 'mismatch' | 'unknown-order'

const payable = (order: Order) => order.status === 'awaiting-payment' || order.status === 'expired'

/** "₦1 in NGN" for naira; any other currency as plain digits with its code, such as "50.00 USD". */
function reportedAmount(payment: PaystackTransaction): string {
  if (payment.currency === 'NGN') return `${formatNaira(payment.requestedAmountKobo)} in NGN`
  const digits = (payment.requestedAmountKobo / 100).toFixed(2)
  return payment.currency ? `${digits} ${payment.currency}` : `${digits} in an unknown currency`
}

/** Records an amount that does not match on the order, and alerts staff the first time only. Runs under the order's lock. */
async function recordMismatch(req: PayloadRequest, order: Order, payment: PaystackTransaction, expectedKobo: number): Promise<void> {
  if (order.payment?.problem) return
  const problem = `Paystack reported ${reportedAmount(payment)}, but the order total is ${formatNaira(expectedKobo)}.`
  await serverUpdate(req, order.id, { payment: { ...order.payment, problem } })
  await queueShopEmail(req, { kind: 'staff-mismatch', orderId: order.id, details: problem })
}

/**
 * Marks an order Paid once Paystack itself confirms the payment. Used by Paystack's webhook, the
 * return page and the expiry job, so it is safe to run twice or at the same moment. Paystack is
 * asked before the order is locked, so no network call holds the lock. Under the lock the order is
 * read again, and the status, the payment details, the history and both emails are written in one
 * transaction: all of it or none of it, so a failure part way leaves the order for a retry to
 * finish. An Expired order is marked Paid late (decided 27 October 2026).
 *
 * Calls made at the same moment must each have a req of their own: one req carries one transaction,
 * and two calls sharing it would share the lock's transaction too (see withRowLock).
 */
export async function markPaid(req: PayloadRequest, reference: string, by: string): Promise<MarkPaidResult> {
  const found = await findOrderByReference(req, reference)
  if (!found) return 'unknown-order'
  if (!payable(found)) return 'unchanged'

  const payment = await shopClients().paystack.verify(reference)
  if (payment.status !== 'success') return 'not-paid'

  return withOrderLock(req, found.id, async () => {
    const order = await findOrder(req, found.id)
    if (!order || !payable(order)) return 'unchanged'
    const expectedKobo = toKobo(order.totalNGN ?? 0)
    // Pending check P1: requestedAmountKobo is the amount before Paystack added its fee.
    if (payment.currency !== 'NGN' || payment.requestedAmountKobo !== expectedKobo) {
      await recordMismatch(req, order, payment, expectedKobo)
      return 'mismatch'
    }

    const from = order.status
    const late = from === 'expired'
    await serverUpdate(req, order.id, {
      status: 'paid',
      payment: { ...order.payment, channel: payment.channel, paidAt: payment.paidAt ?? new Date().toISOString(), paidLate: late },
      chargedNGN: toNaira(payment.amountKobo),
      paystackFeeNGN: toNaira(payment.feesKobo),
      history: appendHistory(order.history, { from, to: 'paid', by, note: late ? 'Paid after the order expired' : null }),
    })
    await queueShopEmail(req, { kind: 'receipt', orderId: order.id })
    await queueShopEmail(req, { kind: 'staff-paid', orderId: order.id })
    return late ? 'paid-late' : 'paid'
  })
}
