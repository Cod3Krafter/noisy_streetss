import type { Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { Book } from '@/payload-types'
import { setShopClients } from '@/shop/clients'

import { getTestPayload, rest } from '../helpers/payload'
import { createShopBook, setShopSettings } from '../helpers/shop'
import { type FakePaystack, useFakeShopClients } from '../helpers/shopFakes'

let payload: Payload
let book: Book
let paystack: FakePaystack
/** The newest job before this file ran. Test files run one at a time, so every later job is this file's. */
let lastJobBefore = 0

const cart = (quantity = 2) => [{ collection: 'books', id: book.id, option: book.formats?.[0]?.id, quantity }]

/** A real stamp, fetched the way the checkout page will: the cheapest courier for this cart and state. */
async function stampFor(state = 'lagos', quantity = 2): Promise<string> {
  const res = await rest('POST', '/shop/quotes', { body: { items: cart(quantity), address: { city: 'Ikeja', state } } })
  return ((await res.json()) as { quotes: { stamp: string }[] }).quotes[0].stamp
}

const details = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ada Obi',
  email: 'Ada@Example.com',
  phone: '0803 123 4567',
  address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos', postcode: '100271' },
  items: cart(),
  ...overrides,
})

const pay = (body: unknown) => rest('POST', '/shop/checkout', { body })
const messageOf = async (res: Response) => JSON.stringify(await res.json())

beforeAll(async () => {
  payload = await getTestPayload()
  await setShopSettings(payload)
  book = await createShopBook(payload)
  const { docs } = await payload.find({ collection: 'payload-jobs', sort: '-id', limit: 1, depth: 0 })
  lastJobBefore = docs[0]?.id ?? 0
})

beforeEach(() => {
  paystack = useFakeShopClients().paystack
})

afterAll(async () => {
  setShopClients(null)
  // The job runner takes the oldest 10 jobs a call, so expiry jobs left queued here would crowd out
  // the job another file's runner test queues.
  await payload.db.deleteMany({ collection: 'payload-jobs', where: { id: { greater_than: lastJobBefore } } })
})

describe('POST /api/shop/checkout', () => {
  it('creates an order priced from the database and starts the payment', async () => {
    const res = await pay(details({ delivery: { stamp: await stampFor() } }))
    expect(res.status).toBe(201)
    const answer = (await res.json()) as { paymentUrl: string; reference: string }
    expect(answer.paymentUrl).toBe(`https://checkout.paystack.test/${answer.reference}`)

    const { docs } = await payload.find({ collection: 'orders', where: { 'payment.reference': { equals: answer.reference } } })
    const order = docs[0]
    expect(order).toMatchObject({
      status: 'awaiting-payment',
      customerName: 'Ada Obi',
      customerEmail: 'ada@example.com',
      customerPhone: '+2348031234567',
      itemsNGN: 20000,
      deliveryNGN: 3350,
      totalNGN: 23350,
      delivery: { method: 'courier', carrierName: 'GIG Logistics', carrierSlug: 'gig', priceNGN: 3350 },
    })
    expect(order.items?.[0]).toMatchObject({ title: book.title, optionName: 'Paperback', unitPriceNGN: 10000, quantity: 2, weightGrams: 400 })
    expect(order.history?.[0]).toMatchObject({ to: 'awaiting-payment', by: 'Checkout' })
    expect(new Date(order.expiresAt as string).getTime() - Date.now()).toBeGreaterThan(29 * 60_000)

    expect(paystack.initialized[0]).toMatchObject({
      email: 'ada@example.com',
      amountKobo: 2_335_000,
      reference: answer.reference,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    })
    expect(paystack.initialized[0].callbackUrl).toMatch(/\/checkout\/complete$/)

    const jobs = await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'expireOrder' } }, limit: 0, pagination: false })
    const expiry = jobs.docs.find((job) => (job.input as { orderId: number }).orderId === order.id)
    expect(expiry?.waitUntil).toBe(order.expiresAt)
  })

  it('answers a bot as if it worked, and saves nothing', async () => {
    const res = await pay(details({ delivery: { stamp: await stampFor() }, website: 'http://spam.example' }))
    expect(res.status).toBe(201)
    const { reference } = (await res.json()) as { reference: string }
    expect((await payload.count({ collection: 'orders', where: { 'payment.reference': { equals: reference } } })).totalDocs).toBe(0)
    expect(paystack.initialized).toHaveLength(0)
  })

  it('refuses a delivery price for another state, another cart or none at all', async () => {
    const lagos = await stampFor('lagos')
    const otherState = await pay(details({ delivery: { stamp: lagos }, address: { line1: '1 Ring Road', city: 'Ibadan', state: 'oyo' } }))
    expect(otherState.status).toBe(400)
    expect(await messageOf(otherState)).toContain('Delivery prices have changed')
    expect((await pay(details({ delivery: { stamp: lagos }, items: cart(3) }))).status).toBe(400)
    expect((await pay(details({ delivery: { stamp: 'made-up' } }))).status).toBe(400)
    expect((await pay(details())).status).toBe(400)
  })

  it('refuses bad details with a message the customer can act on', async () => {
    const stamp = await stampFor()
    const cases: [Record<string, unknown>, string][] = [
      [{ phone: '+44 7700 900123' }, 'Nigerian phone number'],
      [{ email: 'not-an-email' }, 'valid email address'],
      [{ name: '' }, 'Enter your name'],
      [{ address: { city: 'Ikeja', state: 'lagos' } }, 'street address'],
      [{ address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos', postcode: '1234' } }, 'six digits'],
    ]
    for (const [change, message] of cases) {
      const res = await pay(details({ delivery: { stamp }, ...change }))
      expect(res.status).toBe(400)
      expect(await messageOf(res)).toContain(message)
    }
  })

  it('keeps no order when Paystack cannot start the payment', async () => {
    paystack.failInitialize = true
    const res = await pay(details({ email: 'nopay@example.com', delivery: { stamp: await stampFor() } }))
    expect(res.status).toBe(502)
    expect((await payload.count({ collection: 'orders', where: { customerEmail: { equals: 'nopay@example.com' } } })).totalDocs).toBe(0)
  })

  it('refuses an item that sold out after the price was given', async () => {
    const stamp = await stampFor()
    await payload.update({
      collection: 'books',
      id: book.id,
      data: { formats: [{ ...book.formats?.[0], inStock: false }] as never },
    })
    const res = await pay(details({ delivery: { stamp } }))
    expect(res.status).toBe(400)
    expect(await messageOf(res)).toContain('is sold out')
    await payload.update({ collection: 'books', id: book.id, data: { formats: [{ ...book.formats?.[0], inStock: true }] as never } })
  })
})
