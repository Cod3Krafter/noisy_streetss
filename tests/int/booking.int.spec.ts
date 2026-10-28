import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { bookCourier, courierOptions } from '@/shop/booking'
import { setShopClients } from '@/shop/clients'
import { serverUpdate } from '@/shop/orders'

import { createStaff, getTestPayload, rest, tokenFor } from '../helpers/payload'
import { createOrder, setShopSettings } from '../helpers/shop'
import { type FakeTerminal, useFakeShopClients } from '../helpers/shopFakes'

let payload: Payload
let req: PayloadRequest
let terminal: FakeTerminal
let shop: User
let editor: User

/** The newest job before this file ran. Test files run one at a time, so every later job is this file's. */
let lastJobBefore = 0

const paidOrder = (overrides: Record<string, unknown> = {}) => createOrder(payload, { status: 'paid', ...overrides })

beforeAll(async () => {
  payload = await getTestPayload()
  req = await createLocalReq({}, payload)
  await setShopSettings(payload)
  shop = await createStaff(payload, 'shop')
  editor = await createStaff(payload, 'editor')
  const { docs } = await payload.find({ collection: 'payload-jobs', sort: '-id', limit: 1, depth: 0 })
  lastJobBefore = docs[0]?.id ?? 0
})

beforeEach(() => {
  terminal = useFakeShopClients().terminal
})

afterAll(async () => {
  setShopClients(null)
  await payload.db.deleteMany({ collection: 'payload-jobs', where: { id: { greater_than: lastJobBefore } } })
})

describe('courierOptions', () => {
  it("lists today's bookable prices, the customer's courier first, with the wallet", async () => {
    const order = await paidOrder()
    const options = await courierOptions(req, order.id)
    expect(options.options.map((option) => [option.carrierSlug, option.priceKobo, option.isCustomerChoice])).toEqual([
      ['gig', 335_000, true],
      ['dhl', 790_000, false],
    ])
    expect(options).toMatchObject({ walletKobo: 5_000_000, paidDeliveryKobo: 320_000, missingPostcode: false, staleClaim: false, terminalError: null })
    expect(terminal.quoteCalls[0]).toMatchObject({
      bookable: true,
      pickup: { name: 'Test Dispatch', line1: '1 Test Street', postcode: '100271', state: 'lagos' },
      delivery: { name: 'Ada Obi', phone: '+2348031234567', line1: '5 Allen Avenue', postcode: '100271', state: 'lagos' },
      parcel: { packagingId: 'PA-TEST-BOX' },
    })
  })

  it('asks Terminal nothing for an order that is not Paid, or has no postcode', async () => {
    const waiting = await createOrder(payload)
    expect((await courierOptions(req, waiting.id)).options).toEqual([])
    const noPostcode = await paidOrder({ address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos' } })
    expect((await courierOptions(req, noPostcode.id)).missingPostcode).toBe(true)
    expect(terminal.quoteCalls).toHaveLength(0)
  })

  it('says when Terminal cannot be reached', async () => {
    terminal.failQuotes = true
    const order = await paidOrder()
    expect((await courierOptions(req, order.id)).terminalError).toContain("Couldn't reach Terminal")
  })
})

describe('bookCourier', () => {
  it('books, records the shipment, and queues the tracking email', async () => {
    const order = await paidOrder()
    const booked = await bookCourier(req, order.id, 'rate-dhl', 'Packer')
    expect(booked.status).toBe('courier-booked')
    expect(booked.shipment).toMatchObject({
      terminalShipmentId: 'SH-1-rate-dhl',
      carrierName: 'DHL',
      trackingNumber: 'TRK1',
      trackingUrl: 'https://track.test/TRK1',
      labelUrl: 'https://label.test/SH-1.pdf',
      courierCostNGN: 7900,
      bookedBy: 'Packer',
      bookingStartedAt: null,
    })
    expect(booked.history?.at(-1)).toMatchObject({ from: 'paid', to: 'courier-booked', by: 'Packer' })
    const jobs = await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'sendShopEmail' } }, limit: 0, pagination: false })
    expect(jobs.docs.some((job) => (job.input as { kind: string; orderId: number }).kind === 'tracking' && (job.input as { orderId: number }).orderId === order.id)).toBe(true)
  })

  it('books only once when two people press the button together', async () => {
    terminal.bookingDelayMs = 50
    const order = await paidOrder()
    const [reqA, reqB] = await Promise.all([createLocalReq({}, payload), createLocalReq({}, payload)])
    const results = await Promise.allSettled([bookCourier(reqA, order.id, 'rate-gig', 'A'), bookCourier(reqB, order.id, 'rate-gig', 'B')])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const refused = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
    expect(String(refused.reason)).toContain('already being booked')
    expect(terminal.bookings).toHaveLength(1)
  })

  it('refuses when the wallet is short, and lets the order be booked once it is topped up', async () => {
    terminal.walletKobo = 100_000
    const order = await paidOrder()
    await expect(bookCourier(req, order.id, 'rate-gig', 'Packer')).rejects.toThrow('Top it up by at least ₦2,350')
    terminal.walletKobo = 5_000_000
    expect((await bookCourier(req, order.id, 'rate-gig', 'Packer')).status).toBe('courier-booked')
  })

  it("passes on Terminal's refusal and frees the order", async () => {
    terminal.failBooking = true
    const order = await paidOrder()
    await expect(bookCourier(req, order.id, 'rate-gig', 'Packer')).rejects.toThrow('Terminal refused the booking')
    const after = await payload.findByID({ collection: 'orders', id: order.id })
    expect(after.status).toBe('paid')
    expect(after.shipment?.bookingStartedAt ?? null).toBeNull()
  })

  it('keeps the order held when Terminal does not confirm the booking, and warns once the hold lapses', async () => {
    terminal.bookingUnconfirmed = true
    const order = await paidOrder()
    await expect(bookCourier(req, order.id, 'rate-gig', 'Packer')).rejects.toThrow(
      "Terminal did not confirm the booking. It may have gone through: check Terminal's dashboard for this order before booking again. The order stays held for 5 minutes.",
    )
    const after = await payload.findByID({ collection: 'orders', id: order.id })
    expect(after.status).toBe('paid')
    expect(after.shipment?.bookingStartedAt).toBeTruthy()
    expect((await courierOptions(req, order.id)).staleClaim).toBe(false)
    await serverUpdate(req, order.id, { shipment: { bookingStartedAt: new Date(Date.now() - 6 * 60_000).toISOString() } })
    expect((await courierOptions(req, order.id)).staleClaim).toBe(true)
  })

  it('warns about a booking that never finished, and lets staff book once it has lapsed', async () => {
    const order = await paidOrder()
    await serverUpdate(req, order.id, { shipment: { bookingStartedAt: new Date(Date.now() - 6 * 60_000).toISOString() } })
    expect((await courierOptions(req, order.id)).staleClaim).toBe(true)
    expect((await bookCourier(req, order.id, 'rate-gig', 'Packer')).status).toBe('courier-booked')
  })

  it('refuses an order without a postcode, or not Paid', async () => {
    const noPostcode = await paidOrder({ address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos' } })
    await expect(bookCourier(req, noPostcode.id, 'rate-gig', 'Packer')).rejects.toThrow('postcode')
    const waiting = await createOrder(payload)
    await expect(bookCourier(req, waiting.id, 'rate-gig', 'Packer')).rejects.toThrow('Only a Paid order')
  })
})

describe('the courier endpoints', () => {
  it('are open to shop staff and not to editors', async () => {
    const order = await paidOrder()
    expect((await rest('GET', `/orders/${order.id}/courier-options`, { token: await tokenFor(payload, editor) })).status).toBe(403)
    expect((await rest('GET', `/orders/${order.id}/courier-options`, { token: await tokenFor(payload, shop) })).status).toBe(200)
    const booked = await rest('POST', `/orders/${order.id}/book-courier`, { token: await tokenFor(payload, shop), body: { rateId: 'rate-gig' } })
    expect(booked.status).toBe(200)
    expect((await payload.findByID({ collection: 'orders', id: order.id })).shipment?.bookedBy).toBe(shop.name)
  })
})
