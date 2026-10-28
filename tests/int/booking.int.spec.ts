import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Order, User } from '@/payload-types'
import { bookCourier, courierOptions } from '@/shop/booking'
import { claimBooking } from '@/shop/claims'
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
let admin: User

/** The newest job before this file ran. Test files run one at a time, so every later job is this file's. */
let lastJobBefore = 0

const paidOrder = (overrides: Record<string, unknown> = {}) => createOrder(payload, { status: 'paid', ...overrides })

/** Books the way the panel does: with the fingerprint of the prices it was shown. */
const book = async (order: Order, rateId = 'rate-gig', by = 'Packer', on: PayloadRequest = req) =>
  bookCourier(on, order.id, rateId, by, (await courierOptions(on, order.id)).fingerprint)

beforeAll(async () => {
  payload = await getTestPayload()
  req = await createLocalReq({}, payload)
  await setShopSettings(payload)
  shop = await createStaff(payload, 'shop')
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
  const { docs } = await payload.find({ collection: 'payload-jobs', sort: '-id', limit: 1, depth: 0 })
  lastJobBefore = docs[0]?.id ?? 0
})

beforeEach(() => {
  terminal = useFakeShopClients().terminal
})

// Restored here, so a failed assertion can never leave a spy in place for the next test.
afterEach(() => {
  vi.restoreAllMocks()
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

  it('preselects nothing for a flat-price order', async () => {
    const order = await paidOrder({ delivery: { method: 'flat', priceNGN: 3200, estimate: '3 to 5 days' } })
    const options = await courierOptions(req, order.id)
    expect(options.customerChoice).toBeNull()
    expect(options.options.some((option) => option.isCustomerChoice)).toBe(false)
  })

  it('gives a fingerprint that changes with the order details', async () => {
    const order = await paidOrder()
    const first = (await courierOptions(req, order.id)).fingerprint
    expect(first).toMatch(/^[0-9a-f]{16,}$/)
    expect((await courierOptions(req, order.id)).fingerprint).toBe(first)
    await serverUpdate(req, order.id, { customerPhone: '+2348039999999' })
    expect((await courierOptions(req, order.id)).fingerprint).not.toBe(first)
  })

  it('quotes the reason only for a Terminal failure, and says the server is not set up for anything else', async () => {
    const order = await paidOrder()
    vi.spyOn(terminal, 'quotes').mockRejectedValueOnce(new Error('TERMINAL_SECRET_KEY is not set.'))
    const options = await courierOptions(req, order.id)
    expect(options.terminalError).toBe('Courier booking is not set up on this server. The details are in the server log.')
  })

  it('says when Terminal cannot be reached, plainly, and keeps the error code for the log', async () => {
    terminal.failQuotes = true
    const warn = vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    const order = await paidOrder()
    expect((await courierOptions(req, order.id)).terminalError).toBe("Couldn't reach Terminal. Try again in a minute.")
    expect(warn.mock.calls.some(([entry]) => (entry as { err?: Error }).err?.message === 'Terminal could not be reached (fake).')).toBe(true)
  })

  it("passes on Terminal's own words when it answers but cannot give prices", async () => {
    terminal.refuseQuotes = 'Delivery address could not be verified'
    vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    const order = await paidOrder()
    expect((await courierOptions(req, order.id)).terminalError).toBe("Terminal couldn't give prices for this order: Delivery address could not be verified")
  })
})

describe('bookCourier', () => {
  it('books, records the shipment, and queues the tracking email', async () => {
    const order = await paidOrder()
    const booked = await book(order, 'rate-dhl', 'Packer')
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
    const { fingerprint } = await courierOptions(req, order.id)
    const [reqA, reqB] = await Promise.all([createLocalReq({}, payload), createLocalReq({}, payload)])
    const results = await Promise.allSettled([bookCourier(reqA, order.id, 'rate-gig', 'A', fingerprint), bookCourier(reqB, order.id, 'rate-gig', 'B', fingerprint)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const refused = results.find((result) => result.status === 'rejected') as PromiseRejectedResult
    expect(String(refused.reason)).toContain('held by another booking')
    expect(terminal.bookings).toHaveLength(1)
  })

  it('refuses when the wallet is short, and lets the order be booked once it is topped up', async () => {
    terminal.walletKobo = 100_000
    const order = await paidOrder()
    await expect(book(order, 'rate-gig')).rejects.toThrow('Top it up by at least ₦2,350')
    terminal.walletKobo = 5_000_000
    expect((await book(order, 'rate-gig')).status).toBe('courier-booked')
  })

  it("passes on Terminal's refusal and frees the order", async () => {
    terminal.failBooking = true
    vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    const order = await paidOrder()
    await expect(book(order, 'rate-gig')).rejects.toThrow(/^Terminal refused the booking\. Booking refused \(fake\)$/)
    const after = await payload.findByID({ collection: 'orders', id: order.id })
    expect(after.status).toBe('paid')
    expect(after.shipment?.bookingStartedAt ?? null).toBeNull()
  })

  it('keeps the order held when Terminal does not confirm the booking, and warns once the hold lapses', async () => {
    terminal.bookingUnconfirmed = true
    const order = await paidOrder()
    await expect(book(order, 'rate-gig')).rejects.toThrow(
      "Terminal did not confirm the booking. It may have gone through: check Terminal's dashboard for this order before booking again. The order stays held for 5 minutes.",
    )
    const after = await payload.findByID({ collection: 'orders', id: order.id })
    expect(after.status).toBe('paid')
    expect(after.shipment?.bookingStartedAt).toBeTruthy()
    expect(await courierOptions(req, order.id)).toMatchObject({ staleClaim: false, claimHeld: true })
    await serverUpdate(req, order.id, { shipment: { bookingStartedAt: new Date(Date.now() - 6 * 60_000).toISOString() } })
    expect(await courierOptions(req, order.id)).toMatchObject({ staleClaim: true, claimHeld: false })
  })

  it('warns about a booking that never finished, and lets staff book once it has lapsed', async () => {
    const order = await paidOrder()
    await serverUpdate(req, order.id, { shipment: { bookingStartedAt: new Date(Date.now() - 6 * 60_000).toISOString() } })
    expect((await courierOptions(req, order.id)).staleClaim).toBe(true)
    expect((await book(order, 'rate-gig')).status).toBe('courier-booked')
  })

  it('refuses an order that already has a courier booked, and books nothing', async () => {
    const order = await paidOrder({ shipment: { terminalShipmentId: 'SH-OLD' } })
    await expect(book(order)).rejects.toThrow('A courier is already booked for this order.')
    expect(terminal.bookings).toHaveLength(0)
    expect(await claimBooking(req, order.id)).toBe(false)
  })

  it('refuses a booking made from prices fetched before the order changed', async () => {
    const order = await paidOrder()
    const { fingerprint } = await courierOptions(req, order.id)
    await serverUpdate(req, order.id, { address: { line1: '9 Other Road', city: 'Ikeja', state: 'lagos', postcode: '100271' } })
    await expect(bookCourier(req, order.id, 'rate-gig', 'Packer', fingerprint)).rejects.toThrow(
      'The order changed since these prices were fetched. Reload the panel and pick again.',
    )
    expect(terminal.bookings).toHaveLength(0)
    const after = await payload.findByID({ collection: 'orders', id: order.id })
    expect(after.shipment?.bookingStartedAt ?? null).toBeNull()
  })

  it('checks the wallet against the price Terminal gives when booking, not the earlier quote', async () => {
    terminal.walletKobo = 400_000
    terminal.bookPriceKobo['rate-gig'] = 500_000
    const order = await paidOrder()
    await expect(book(order)).rejects.toThrow('Top it up by at least ₦1,000')
    expect(terminal.bookings).toHaveLength(0)
  })

  it("words a refusal before booking as a price or wallet problem, in Terminal's own words", async () => {
    vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    const order = await paidOrder()
    await expect(book(order, 'rate-missing')).rejects.toThrow(/^Couldn't get Terminal's price or wallet: Rate not found$/)
  })

  it('says plainly when Terminal cannot be reached before booking, and frees the order', async () => {
    const order = await paidOrder()
    const { fingerprint } = await courierOptions(req, order.id)
    terminal.failWallet = true
    const warn = vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    await expect(bookCourier(req, order.id, 'rate-gig', 'Packer', fingerprint)).rejects.toThrow(/^Couldn't reach Terminal\. Try again in a minute\.$/)
    expect(warn.mock.calls.some(([entry]) => (entry as { err?: Error }).err?.message === 'Terminal could not be reached (fake).')).toBe(true)
    expect((await payload.findByID({ collection: 'orders', id: order.id })).shipment?.bookingStartedAt ?? null).toBeNull()
  })

  it('tells staff to check Terminal when the booking cannot be recorded, and keeps the order held', async () => {
    const order = await paidOrder()
    const options = await courierOptions(req, order.id)
    const other = await createLocalReq({}, payload)
    vi.spyOn(other.payload, 'update').mockRejectedValueOnce(new Error('database went away'))
    await expect(bookCourier(other, order.id, 'rate-gig', 'Packer', options.fingerprint)).rejects.toThrow(
      "Terminal booked the parcel but the order could not be updated. Check Terminal's dashboard for this order before doing anything else; the order stays held for 5 minutes.",
    )
    expect(terminal.bookings).toHaveLength(1)
    const after = await payload.findByID({ collection: 'orders', id: order.id })
    expect(after.status).toBe('paid')
    expect(after.shipment?.bookingStartedAt).toBeTruthy()
  })

  it('refuses an order without a postcode, or not Paid', async () => {
    const noPostcode = await paidOrder({ address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos' } })
    await expect(book(noPostcode, 'rate-gig')).rejects.toThrow('postcode')
    const waiting = await createOrder(payload)
    await expect(book(waiting, 'rate-gig')).rejects.toThrow('Only a Paid order')
  })
})

describe('the courier endpoints', () => {
  it('are open to shop staff and not to editors', async () => {
    const order = await paidOrder()
    const { fingerprint } = await courierOptions(req, order.id)
    expect((await rest('GET', `/orders/${order.id}/courier-options`, { token: await tokenFor(payload, editor) })).status).toBe(403)
    expect((await rest('GET', `/orders/${order.id}/courier-options`, { token: await tokenFor(payload, shop) })).status).toBe(200)
    const booked = await rest('POST', `/orders/${order.id}/book-courier`, { token: await tokenFor(payload, shop), body: { rateId: 'rate-gig', fingerprint } })
    expect(booked.status).toBe(200)
    expect((await payload.findByID({ collection: 'orders', id: order.id })).shipment?.bookedBy).toBe(shop.name)
  })

  it('are open to admins', async () => {
    const order = await paidOrder()
    const token = await tokenFor(payload, admin)
    const options = await rest('GET', `/orders/${order.id}/courier-options`, { token })
    expect(options.status).toBe(200)
    const { fingerprint } = (await options.json()) as { fingerprint: string }
    expect((await rest('POST', `/orders/${order.id}/book-courier`, { token, body: { rateId: 'rate-gig', fingerprint } })).status).toBe(200)
  })

  it('sends a reason with each 409, so the panel can tell the cases apart without reading the message', async () => {
    const token = await tokenFor(payload, shop)
    const reasonOf = async (res: Response) => {
      expect(res.status).toBe(409)
      return ((await res.json()) as { errors: { data?: { reason?: string } }[] }).errors[0].data?.reason
    }
    const post = (order: Order, fingerprint: string) => rest('POST', `/orders/${order.id}/book-courier`, { token, body: { rateId: 'rate-gig', fingerprint } })

    const changed = await paidOrder()
    const stale = (await courierOptions(req, changed.id)).fingerprint
    await serverUpdate(req, changed.id, { address: { line1: '9 Other Road', city: 'Ikeja', state: 'lagos', postcode: '100271' } })
    expect(await reasonOf(await post(changed, stale))).toBe('stale-prices')

    const booked = await paidOrder({ shipment: { terminalShipmentId: 'SH-OLD' } })
    expect(await reasonOf(await post(booked, 'x'))).toBe('already-booked')

    const held = await paidOrder()
    const heldPrices = (await courierOptions(req, held.id)).fingerprint
    expect(await claimBooking(req, held.id)).toBe(true)
    expect(await reasonOf(await post(held, heldPrices))).toBe('held')
  })

  it('answers 404 for an id that is not a positive whole number, before touching the database', async () => {
    const token = await tokenFor(payload, shop)
    for (const id of ['abc', '0', '-3', '1.5']) {
      expect((await rest('GET', `/orders/${id}/courier-options`, { token })).status).toBe(404)
      expect((await rest('POST', `/orders/${id}/book-courier`, { token, body: { rateId: 'rate-gig', fingerprint: 'x' } })).status).toBe(404)
    }
  })
})
