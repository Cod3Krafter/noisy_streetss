import type { PayloadRequest } from 'payload'

import { adminEntryUrl } from '@/hooks/formAlert'
import type { Order } from '@/payload-types'
import { formatNaira, toKobo } from '@/shop/money'
import { readShopSettings } from '@/shop/settings'
import { stateLabel } from '@/shop/states'

export const SHOP_EMAIL_KINDS = [
  'receipt',
  'tracking',
  'staff-paid',
  'staff-mismatch',
  'staff-returned',
  'staff-pickup-failed',
  'staff-charge-failed',
  'staff-weight-claim',
] as const

export type ShopEmailKind = (typeof SHOP_EMAIL_KINDS)[number]
export type ShopEmailInput = { kind: ShopEmailKind; orderId: number; details?: string | null }
type Contact = { email: string | null; phone: string | null }
type BuiltEmail = { audience: 'customer' | 'staff'; subject: string; text: string; html: string }

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const naira = (value: number | null | undefined) => formatNaira(toKobo(value ?? 0))
const paragraphs = (lines: string[]) => lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')

function itemLines(order: Order): string[] {
  return (order.items ?? []).map(
    (item) => `${item.quantity} x ${item.title}${item.optionName ? ` (${item.optionName})` : ''}: ${naira((item.unitPriceNGN ?? 0) * (item.quantity ?? 0))}`,
  )
}

function contactLine(contact: Contact, number: string): string | null {
  const ways = [contact.email ? `email ${contact.email}` : null, contact.phone ? `call ${contact.phone}` : null].filter(Boolean)
  if (ways.length === 0) return null
  const joined = ways.join(' or ')
  return `Questions about this order? ${joined.charAt(0).toUpperCase()}${joined.slice(1)}, quoting ${number}.`
}

/** The email for one kind of event on one order. Pure, so the wording is tested without sending anything. */
export function buildShopEmail(order: Order, input: ShopEmailInput, contact: Contact): BuiltEmail {
  const number = order.orderNumber ?? `order ${order.id}`
  const link = adminEntryUrl('orders', order.id)

  const customer = (subject: string, lines: string[]): BuiltEmail => {
    const all = [...lines, ...[contactLine(contact, number)].filter((line): line is string => Boolean(line))]
    return { audience: 'customer', subject, text: `${all.join('\n\n')}\n`, html: paragraphs(all) }
  }
  const staff = (subject: string, lines: string[]): BuiltEmail => {
    const all = [...lines, ...(input.details ? [input.details] : [])]
    return {
      audience: 'staff',
      subject,
      text: `${all.join('\n\n')}\n\nOpen it in the admin: ${link}\n`,
      html: `${paragraphs(all)}<p><a href="${link}">Open it in the admin</a></p>`,
    }
  }

  switch (input.kind) {
    case 'receipt': {
      const first = order.customerName?.trim().split(/\s+/)[0]
      const delivery = order.delivery?.method === 'courier' && order.delivery.carrierName
        ? `Delivery (${order.delivery.carrierName}${order.delivery.estimate ? `, ${order.delivery.estimate}` : ''})`
        : 'Delivery'
      const where = [order.address?.line1, order.address?.city, order.address?.state ? stateLabel(order.address.state) : null].filter(Boolean)
      return customer(`Your Noisy Streetss order ${number}`, [
        `${first ? `Thank you, ${first}.` : 'Thank you.'} Your payment has been received and order ${number} is being prepared.`,
        ...itemLines(order),
        `${delivery}: ${naira(order.deliveryNGN)}`,
        ...(order.paystackFeeNGN ? [`Paystack fee: ${naira(order.paystackFeeNGN)}`] : []),
        `Total paid: ${naira(order.chargedNGN ?? order.totalNGN)}`,
        `Delivering to: ${where.join(', ')}`,
        'A second email will follow with a tracking link once the parcel is booked with the courier.',
      ])
    }
    case 'tracking': {
      const carrier = order.shipment?.carrierName ?? 'the courier'
      return customer(`Your order ${number} has been booked with ${carrier}`, [
        `Order ${number} has been booked with ${carrier} and will be collected soon.`,
        ...(order.shipment?.trackingNumber ? [`Tracking number: ${order.shipment.trackingNumber}`] : []),
        ...(order.shipment?.trackingUrl ? [`Follow it here: ${order.shipment.trackingUrl}`] : []),
      ])
    }
    case 'staff-paid':
      return staff(`New paid order ${number}${order.payment?.paidLate ? ' (paid after it expired)' : ''}`, [
        `${order.customerName ?? 'A customer'} paid ${naira(order.chargedNGN ?? order.totalNGN)} for order ${number}.`,
        ...(order.payment?.paidLate ? ['The payment came in after the order had expired. Check the items are still in stock before packing.'] : []),
        ...itemLines(order),
      ])
    case 'staff-mismatch':
      return staff(`Payment amount problem on ${number}`, [
        `Paystack reported a payment for ${number} that does not match the order, so it was not marked Paid. Check it in Paystack's dashboard.`,
      ])
    case 'staff-returned':
      return staff(`Parcel returned: ${number}`, [`Terminal reports that the parcel for ${number} was returned. Contact the customer, then refund or book again.`])
    case 'staff-pickup-failed':
      return staff(`Pickup failed: ${number}`, [`Terminal reports that the courier could not collect the parcel for ${number}. Check Terminal's dashboard.`])
    case 'staff-charge-failed':
      return staff(`Terminal could not charge the wallet: ${number}`, [
        `Terminal could not take payment from the wallet for ${number}. Top up the wallet in Terminal's dashboard, then check the booking.`,
      ])
    case 'staff-weight-claim':
      return staff(`Heavier parcel claimed: ${number}`, [
        `The carrier recorded a heavier parcel than was booked for ${number}. The extra is billed to the Terminal wallet 7 days after the claim unless it is disputed in Terminal's dashboard.`,
      ])
  }
}

/** Builds and sends one shop email. Run by the sendShopEmail job, so a failure is retried. */
export async function sendShopEmail(req: PayloadRequest, input: ShopEmailInput): Promise<void> {
  const order = await req.payload.findByID({ collection: 'orders', id: input.orderId, depth: 0, overrideAccess: true, disableErrors: true, req })
  if (!order) {
    req.payload.logger.warn(`The "${input.kind}" email was skipped: order ${input.orderId} no longer exists.`)
    return
  }
  const site = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true, req })
  const email = buildShopEmail(order, input, { email: site.contactEmail ?? null, phone: site.phone ?? null })
  const to = email.audience === 'customer' ? order.customerEmail : (await readShopSettings(req)).orderAlertEmail
  if (!to) {
    req.payload.logger.warn(`No address for the "${input.kind}" email about ${order.orderNumber}, so it was not sent.`)
    return
  }
  await req.payload.sendEmail({ to, subject: email.subject, text: email.text, html: email.html })
}

export async function queueShopEmail(req: PayloadRequest, input: ShopEmailInput): Promise<void> {
  await req.payload.jobs.queue({ task: 'sendShopEmail', input, req })
}
