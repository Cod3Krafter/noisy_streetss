import { randomBytes } from 'node:crypto'
import { commitTransaction, initTransaction, killTransaction, type PayloadRequest } from 'payload'

import { isSpam } from '@/hooks/honeypot'
import { Refusal } from '@/refusal'
import { emailValidator } from '@/rules/validators'
import { parcelWeightGrams, parseCart, priceOrder, resolveCart } from '@/shop/cart'
import { shopClients } from '@/shop/clients'
import { SHOP_SERVER } from '@/shop/context'
import { toNaira } from '@/shop/money'
import { PaystackError } from '@/shop/paystack'
import { NIGERIAN_PHONE_PROBLEM, normaliseNigerianPhone } from '@/shop/phone'
import { readShopSettings } from '@/shop/settings'
import { quoteStampSecret, readQuote } from '@/shop/stamp'
import { isNigerianPostcode, isNigerianState, NIGERIAN_POSTCODE_PROBLEM } from '@/shop/states'

export type CheckoutAnswer = { paymentUrl: string; reference: string }

export const STALE_DELIVERY = 'Delivery prices have changed. Refresh them and try again.'

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

/** Where Paystack sends the customer back to. Paystack adds `?trxref=<reference>&reference=<reference>`. */
function returnUrl(): string {
  return `${(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')}/checkout/complete`
}

/** Random and unguessable: it sits in the return page's web address and unlocks the order summary. */
const newReference = () => `ns_${randomBytes(12).toString('hex')}`

async function parseCustomer(req: PayloadRequest, body: Record<string, unknown>) {
  const name = text(body.name)
  if (!name || name.length > 120) throw new Refusal('Enter your name.')
  const email = text(body.email).toLowerCase()
  const emailCheck = await emailValidator(email, { req, required: true } as never)
  if (!email || emailCheck !== true) throw new Refusal('Enter a valid email address.')
  const phone = normaliseNigerianPhone(body.phone)
  if (!phone) throw new Refusal(NIGERIAN_PHONE_PROBLEM)
  return { name, email, phone }
}

function parseAddress(value: unknown) {
  const address = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const line1 = text(address.line1)
  const line2 = text(address.line2)
  const city = text(address.city)
  const postcode = text(address.postcode)
  if (!line1 || line1.length > 200) throw new Refusal('Enter the street address for delivery.')
  if (line2.length > 200) throw new Refusal('Address line 2 is too long.')
  if (!city || city.length > 100) throw new Refusal('Enter the town or city for delivery.')
  if (!isNigerianState(address.state)) throw new Refusal('Pick the state for delivery.')
  // Pending check P2: optional until the sandbox shows whether Terminal needs it at checkout.
  if (postcode && !isNigerianPostcode(postcode)) throw new Refusal(NIGERIAN_POSTCODE_PROBLEM)
  return { line1, line2: line2 || null, city, state: address.state, postcode: postcode || null }
}

/**
 * Creates the order, queues its expiry job and starts its Paystack payment, all or nothing: if the job
 * can't be queued or Paystack can't start the payment, no order and no job are kept. Everything the
 * customer sees is checked and priced again here.
 */
export async function checkout(req: PayloadRequest, body: Record<string, unknown>): Promise<CheckoutAnswer> {
  if (isSpam(body)) {
    // As B1's forms do: a bot gets a normal-looking answer, nothing is saved and Paystack is never called.
    const reference = newReference()
    return { paymentUrl: `${returnUrl()}?reference=${reference}`, reference }
  }
  const customer = await parseCustomer(req, body)
  const address = parseAddress(body.address)
  const lines = await resolveCart(req, parseCart(body.items))
  const settings = await readShopSettings(req)
  const quote = readQuote((body.delivery as { stamp?: unknown } | undefined)?.stamp, quoteStampSecret())
  if (!quote || quote.state !== address.state || quote.weightGrams !== parcelWeightGrams(lines, settings.boxWeightGrams)) {
    throw new Refusal(STALE_DELIVERY)
  }
  const totals = priceOrder(lines, quote.priceKobo)
  const reference = newReference()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + settings.expiryMinutes * 60_000)

  const shouldCommit = await initTransaction(req)
  try {
    const order = await req.payload.create({
      collection: 'orders',
      overrideAccess: true,
      context: { [SHOP_SERVER]: true },
      depth: 0,
      req,
      data: {
        status: 'awaiting-payment',
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        address: { ...address, country: 'Nigeria' },
        items: lines.map((line) => ({
          product: { relationTo: line.collection, value: line.id },
          optionId: line.optionId,
          optionName: line.optionName,
          title: line.title,
          unitPriceNGN: toNaira(line.unitPriceKobo),
          quantity: line.quantity,
          weightGrams: line.weightGrams,
        })),
        delivery: {
          method: quote.method,
          carrierName: quote.carrierName,
          carrierSlug: quote.carrierSlug,
          estimate: quote.estimate || null,
          priceNGN: toNaira(quote.priceKobo),
          flatArea: quote.area,
        },
        itemsNGN: toNaira(totals.itemsKobo),
        deliveryNGN: toNaira(totals.deliveryKobo),
        totalNGN: toNaira(totals.totalKobo),
        payment: { reference },
        expiresAt: expiresAt.toISOString(),
        history: [{ at: now.toISOString(), to: 'awaiting-payment', by: 'Checkout' }],
      },
    })
    // Queued through the same req, so the job is saved or dropped together with the order.
    await req.payload.jobs.queue({ task: 'expireOrder', input: { orderId: order.id }, waitUntil: expiresAt, req })
    const { authorizationUrl } = await shopClients().paystack.initialize({
      email: customer.email,
      amountKobo: totals.totalKobo,
      reference,
      callbackUrl: returnUrl(),
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    })
    if (shouldCommit) await commitTransaction(req)
    return { paymentUrl: authorizationUrl, reference }
  } catch (error) {
    await killTransaction(req)
    if (error instanceof PaystackError) {
      req.payload.logger.warn({ err: error, msg: 'Paystack could not start a payment, so no order was kept.' })
      throw new Refusal('The payment could not be started. Please try again in a moment.', 502)
    }
    throw error
  }
}
