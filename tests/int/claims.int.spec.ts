import { sql } from '@payloadcms/db-postgres'
import { createLocalReq, type Payload, type PayloadRequest } from 'payload'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { Order } from '@/payload-types'
import { BOOKING_CLAIM_LAPSES_MS, claimBooking, recordEventOnce, releaseBooking, withOrderLock } from '@/shop/claims'
import { findOrder, serverUpdate } from '@/shop/orders'

import { getTestPayload } from '../helpers/payload'
import { createOrder } from '../helpers/shop'

let payload: Payload
let req: PayloadRequest

/** A request of its own, so it gets a transaction of its own. */
const newReq = () => createLocalReq({}, payload)
const reload = (order: Order) => payload.findByID({ collection: 'orders', id: order.id, depth: 0 })
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const msAgo = (ms: number) => new Date(Date.now() - ms).toISOString()

/** How many statements Postgres has waiting on a row lock taken with FOR UPDATE. */
async function lockWaits(): Promise<number> {
  const db = (payload.db as unknown as { drizzle: { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: { waiting: number }[] }> } }).drizzle
  const { rows } = await db.execute(
    sql`select count(*)::int as "waiting" from pg_stat_activity where wait_event_type = 'Lock' and query ilike '%for update%'`,
  )
  return rows[0]?.waiting ?? 0
}

beforeAll(async () => {
  payload = await getTestPayload()
  req = await newReq()
})

describe('withOrderLock', () => {
  it('makes a second caller wait until the first commits, then shows it the committed order', async () => {
    const order = await createOrder(payload)
    const reqA = await newReq()
    const reqB = await newReq()
    let release!: () => void
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    let aInside = false
    const a = withOrderLock(reqA, order.id, async () => {
      await serverUpdate(reqA, order.id, { staffNotes: 'Written by A' })
      aInside = true
      await held
    })
    await vi.waitFor(() => expect(aInside).toBe(true))

    let bStarted = false
    let bSaw: string | null | undefined
    const b = withOrderLock(reqB, order.id, async () => {
      bStarted = true
      bSaw = (await findOrder(reqB, order.id))?.staffNotes
    })
    await pause(200)
    expect(bStarted).toBe(false)
    expect(await lockWaits()).toBe(1)

    release()
    await Promise.all([a, b])
    expect(bStarted).toBe(true)
    expect(bSaw).toBe('Written by A')
  })

  it('rolls back everything the work wrote when it fails, and leaves the request usable', async () => {
    const order = await createOrder(payload)
    const failing = withOrderLock(req, order.id, async () => {
      await serverUpdate(req, order.id, { staffNotes: 'Never kept' })
      throw new Error('Something failed part way (test).')
    })
    await expect(failing).rejects.toThrow('Something failed part way (test).')
    expect((await reload(order)).staffNotes).toBeFalsy()
    expect(req.transactionID).toBeUndefined()

    await withOrderLock(req, order.id, () => serverUpdate(req, order.id, { staffNotes: 'Kept' }))
    expect((await reload(order)).staffNotes).toBe('Kept')
  })
})

describe('recordEventOnce', () => {
  it('refuses to run outside withRowLock, rather than writing on the pool', async () => {
    await expect(recordEventOnce(await newReq(), `test:no-lock:${Date.now()}`)).rejects.toThrow('withRowLock needs a transaction')
  })
})

describe('claimBooking and releaseBooking', () => {
  it('gives the order to exactly one of two claims made together', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    const results = await Promise.all([claimBooking(req, order.id), claimBooking(req, order.id)])
    expect(results.sort()).toEqual([false, true])
  })

  it('lets a claim be taken again only once it is more than five minutes old', async () => {
    const recent = await createOrder(payload, { status: 'paid', shipment: { bookingStartedAt: msAgo(BOOKING_CLAIM_LAPSES_MS - 60_000) } })
    const lapsed = await createOrder(payload, { status: 'paid', shipment: { bookingStartedAt: msAgo(BOOKING_CLAIM_LAPSES_MS + 60_000) } })
    expect(await claimBooking(req, recent.id)).toBe(false)
    expect(await claimBooking(req, lapsed.id)).toBe(true)
  })

  it('clears a claim on release, so the order can be claimed again', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    expect(await claimBooking(req, order.id)).toBe(true)
    expect((await reload(order)).shipment?.bookingStartedAt).toBeTruthy()
    await releaseBooking(req, order.id)
    expect((await reload(order)).shipment?.bookingStartedAt).toBeFalsy()
    expect(await claimBooking(req, order.id)).toBe(true)
  })

  it('never claims an order that already has a courier booked', async () => {
    const order = await createOrder(payload, { status: 'paid', shipment: { terminalShipmentId: 'SH-OLD' } })
    expect(await claimBooking(req, order.id)).toBe(false)
  })

  it("judges a claim's age by the database's clock, not the app's", async () => {
    const order = await createOrder(payload, { status: 'paid' })
    expect(await claimBooking(req, order.id)).toBe(true)
    const realNow = Date.now()
    // The app's clock runs ten minutes ahead of the database's.
    const now = vi.spyOn(Date, 'now').mockReturnValue(realNow + 10 * 60_000)
    try {
      expect(await claimBooking(req, order.id)).toBe(false)
    } finally {
      now.mockRestore()
    }
  })

  it('never claims an order that is not Paid', async () => {
    for (const status of ['awaiting-payment', 'expired', 'courier-booked']) {
      const order = await createOrder(payload, { status })
      expect(await claimBooking(req, order.id)).toBe(false)
    }
  })
})
