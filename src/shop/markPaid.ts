import type { PayloadRequest } from 'payload'

import type { Order } from '@/payload-types'
import { claimStatus } from '@/shop/claims'
import { shopClients } from '@/shop/clients'
import { queueShopEmail } from '@/shop/emails'
import { appendHistory } from '@/shop/history'
import { formatNaira, toKobo, toNaira } from '@/shop/money'
import { findOrderByReference, serverUpdate } from '@/shop/orders'
import type { PaystackTransaction } from '@/shop/paystack'

export type MarkPaidResult = 'paid' | 'paid-late' | 'unchanged' | 'not-paid' | 'mismatch' | 'unknown-order'

/** Records an amount that does not match on the order, and alerts staff the first time only. */
async function recordMismatch(req: PayloadRequest, order: Order, payment: PaystackTransaction, expectedKobo: number): Promise<void> {
  if (order.payment?.problem) return
  const problem = `Paystack reported ${formatNaira(payment.requestedAmountKobo)} in ${payment.currency || 'an unknown currency'}, but the order total is ${formatNaira(expectedKobo)}.`
  await serverUpdate(req, order.id, { payment: { ...order.payment, problem } })
  await queueShopEmail(req, { kind: 'staff-mismatch', orderId: order.id, details: problem })
}

/**
 * Marks an order Paid once Paystack itself confirms the payment. Used by Paystack's webhook, the
 * return page and the expiry job, so it is safe to run twice or at the same moment: only the call
 * that actually moves the order records the payment and queues the emails. An Expired order is
 * marked Paid late (decided 27 October 2026).
 */
export async function markPaid(req: PayloadRequest, reference: string, by: string): Promise<MarkPaidResult> {
  const order = await findOrderByReference(req, reference)
  if (!order) return 'unknown-order'
  if (order.status !== 'awaiting-payment' && order.status !== 'expired') return 'unchanged'

  const payment = await shopClients().paystack.verify(reference)
  if (payment.status !== 'success') return 'not-paid'
  const expectedKobo = toKobo(order.totalNGN ?? 0)
  // Pending check P1: requestedAmountKobo is the amount before Paystack added its fee.
  if (payment.currency !== 'NGN' || payment.requestedAmountKobo !== expectedKobo) {
    await recordMismatch(req, order, payment, expectedKobo)
    return 'mismatch'
  }

  const from = order.status
  if (!(await claimStatus(req, order.id, ['awaiting-payment', 'expired'], 'paid'))) return 'unchanged'
  const late = from === 'expired'
  await serverUpdate(req, order.id, {
    payment: { ...order.payment, channel: payment.channel, paidAt: payment.paidAt ?? new Date().toISOString(), paidLate: late },
    chargedNGN: toNaira(payment.amountKobo),
    paystackFeeNGN: toNaira(payment.feesKobo),
    history: appendHistory(order.history, { from, to: 'paid', by, note: late ? 'Paid after the order expired' : null }),
  })
  await queueShopEmail(req, { kind: 'receipt', orderId: order.id })
  await queueShopEmail(req, { kind: 'staff-paid', orderId: order.id })
  return late ? 'paid-late' : 'paid'
}
