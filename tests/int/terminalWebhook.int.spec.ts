import config from '@payload-config'
import { createLocalReq, handleEndpoints, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Order } from '@/payload-types'
import { claimBooking } from '@/shop/claims'
import { hmacSha512Hex } from '@/shop/signatures'
import { applyTerminalEvent } from '@/shop/terminalEvents'

import { getTestPayload, rest } from '../helpers/payload'
import { createOrder, setShopSettings } from '../helpers/shop'

let payload: Payload
let shipmentCount = 0
let lastJobBefore = 0

const sign = (body: unknown) => hmacSha512Hex(JSON.stringify(body), process.env.TERMINAL_SECRET_KEY as string)
const send = (body: unknown, signature = sign(body)) => rest('POST', '/terminal/webhook', { body, headers: { 'x-terminal-signature': signature } })
const event = (name: string, shipmentId: string, extra: Record<string, unknown> = {}) => ({
  event: name,
  event_id: `evt-${name}-${shipmentId}-${Math.random()}`,
  data: { shipment_id: shipmentId, ...extra },
})
const reload = (order: Order) => payload.findByID({ collection: 'orders', id: order.id, depth: 0 })

async function bookedOrder(status = 'courier-booked') {
  shipmentCount += 1
  const shipmentId = `SH-hook-${shipmentCount}`
  const order = await createOrder(payload, {
    status,
    shipment: { terminalShipmentId: shipmentId, carrierName: 'GIG Logistics', trackingNumber: `TRK-${shipmentCount}`, courierCostNGN: 3350, bookedBy: 'Packer', bookedAt: '2026-10-28T09:00:00.000Z', bookingStartedAt: '2026-10-28T09:00:00.000Z' },
  })
  return { order, shipmentId }
}

async function emailKinds(order: Order): Promise<string[]> {
  const { docs } = await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'sendShopEmail' } }, limit: 0, pagination: false, sort: 'id' })
  return docs.map((job) => job.input as { kind: string; orderId: number }).filter((input) => input.orderId === order.id).map((input) => input.kind)
}

beforeAll(async () => {
  payload = await getTestPayload()
  await setShopSettings(payload)
  const { docs } = await payload.find({ collection: 'payload-jobs', sort: '-id', limit: 1, depth: 0 })
  lastJobBefore = docs[0]?.id ?? 0
})

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(async () => {
  await payload.db.deleteMany({ collection: 'payload-jobs', where: { id: { greater_than: lastJobBefore } } })
})

describe("Terminal's webhook", () => {
  it('refuses a body without the right signature', async () => {
    const { order, shipmentId } = await bookedOrder()
    expect((await send(event('shipment.delivered', shipmentId), 'f'.repeat(128))).status).toBe(401)
    expect((await reload(order)).status).toBe('courier-booked')
  })

  it('moves an order forward through its delivery', async () => {
    const { order, shipmentId } = await bookedOrder()
    expect((await send(event('pickup.completed', shipmentId))).status).toBe(200)
    expect((await reload(order)).status).toBe('in-transit')
    await send(event('shipment.delivered', shipmentId))
    const delivered = await reload(order)
    expect(delivered.status).toBe('delivered')
    expect(delivered.history?.at(-1)).toMatchObject({ from: 'in-transit', to: 'delivered', by: 'Terminal' })
  })

  it('does nothing with a pickup event it has already seen by its event id', async () => {
    const { order, shipmentId } = await bookedOrder()
    const once = event('pickup.completed', shipmentId)
    await send(once)
    const length = (await reload(order)).history?.length
    expect((await send(once)).status).toBe(200)
    expect((await reload(order)).history?.length).toBe(length)
  })

  it('recognises a shipment event sent again byte for byte, though it carries no event id', async () => {
    const { order, shipmentId } = await bookedOrder()
    const once = { event: 'shipment.in-transit', data: { shipment_id: shipmentId, status: 'in-transit' } }
    await send(once)
    const length = (await reload(order)).history?.length
    expect((await send(once)).status).toBe(200)
    expect((await reload(order)).history?.length).toBe(length)
  })

  it('queues one alert for a charge failure sent again byte for byte, with no event id', async () => {
    const { order, shipmentId } = await bookedOrder()
    const once = { event: 'transaction.failed', data: { id: 'Qm8z', transaction_id: 'TR-9', shipment: shipmentId } }
    await send(once)
    await send(once)
    expect(await emailKinds(order)).toEqual(['staff-charge-failed'])
  })

  it('applies a pickup event to every shipment in it, once each', async () => {
    const first = await bookedOrder()
    const second = await bookedOrder()
    const body = { event: 'pickup.completed', event_id: `evt-multi-${first.shipmentId}`, data: { pickup_id: 'PU-9', shipment_ids: [first.shipmentId, second.shipmentId] } }
    expect((await send(body)).status).toBe(200)
    expect((await reload(first.order)).status).toBe('in-transit')
    expect((await reload(second.order)).status).toBe('in-transit')
    const lengths = [(await reload(first.order)).history?.length, (await reload(second.order)).history?.length]
    await send(body)
    expect([(await reload(first.order)).history?.length, (await reload(second.order)).history?.length]).toEqual(lengths)
  })

  it('leaves a newer booking alone when a cancellation names the old shipment', async () => {
    const { order } = await bookedOrder()
    const stale = await payload.findByID({ collection: 'orders', id: order.id, depth: 0 })
    const warn = vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    // The lookup sees the old shipment id, as it would if a new booking landed before the lock was taken.
    vi.spyOn(payload, 'find').mockResolvedValueOnce({ docs: [stale] } as never)
    const result = await applyTerminalEvent(await createLocalReq({}, payload), { type: 'shipment.cancelled', shipmentIds: ['SH-old'], data: {} }, 'evt-stale')
    vi.restoreAllMocks()
    expect(result).toBe('ignored')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('SH-old'))
    const after = await reload(order)
    expect(after.status).toBe('courier-booked')
    expect(after.shipment?.terminalShipmentId).toBe(stale.shipment?.terminalShipmentId)
  })

  it('answers 400 to a signed body that is not JSON', async () => {
    const body = 'not json at all'
    const response = await handleEndpoints({
      config,
      request: new Request('http://localhost:3000/api/terminal/webhook', {
        method: 'POST',
        headers: { 'x-terminal-signature': hmacSha512Hex(body, process.env.TERMINAL_SECRET_KEY as string) },
        body,
      }),
    })
    expect(response.status).toBe(400)
  })

  it('only notes a cancellation that arrives when the order is not Courier booked', async () => {
    const { order, shipmentId } = await bookedOrder('in-transit')
    await send(event('shipment.cancelled', shipmentId))
    const after = await reload(order)
    expect(after.status).toBe('in-transit')
    expect(after.shipment?.terminalShipmentId).toBe(shipmentId)
    expect(after.history?.at(-1)?.note).toContain('Nothing was changed')
  })

  it('frees a cancelled order to be booked again', async () => {
    const { order, shipmentId } = await bookedOrder()
    await send(event('shipment.cancelled', shipmentId))
    const after = await reload(order)
    expect(after.shipment?.bookingStartedAt ?? null).toBeNull()
    expect(await claimBooking(await createLocalReq({}, payload), order.id)).toBe(true)
  })

  it('never drags an order back, and notes the late update', async () => {
    const { order, shipmentId } = await bookedOrder('delivered')
    await send(event('shipment.in-transit', shipmentId))
    const after = await reload(order)
    expect(after.status).toBe('delivered')
    expect(after.history?.at(-1)?.note).toContain('Late update ignored')
  })

  it('sends a cancelled booking back to Paid, keeping its details in the history', async () => {
    const { order, shipmentId } = await bookedOrder()
    await send(event('shipment.cancelled', shipmentId))
    const after = await reload(order)
    expect(after.status).toBe('paid')
    expect(after.shipment?.terminalShipmentId ?? null).toBeNull()
    expect(after.history?.at(-1)).toMatchObject({ from: 'courier-booked', to: 'paid', by: 'Terminal' })
    expect(after.history?.at(-1)?.note).toContain(shipmentId)
    expect(after.history?.at(-1)?.note).toBe(`Booking cancelled in Terminal (was GIG Logistics, ₦3,350, booked by Packer on 28 Oct 2026, shipment ${shipmentId}, tracking ${order.shipment?.trackingNumber})`)
  })

  it('alerts staff about a return, a failed pickup, a failed charge and a weight claim', async () => {
    const returned = await bookedOrder('in-transit')
    await send(event('shipment.returned', returned.shipmentId))
    expect((await reload(returned.order)).status).toBe('returned')
    expect(await emailKinds(returned.order)).toEqual(['staff-returned'])

    const pickup = await bookedOrder()
    await send(event('pickup.failed', pickup.shipmentId))
    expect((await reload(pickup.order)).status).toBe('courier-booked')
    await send(event('transaction.failed', pickup.shipmentId))
    await send(event('reconciliation.flagged', pickup.shipmentId, { exception_charge: 1500 }))
    expect(await emailKinds(pickup.order)).toEqual(['staff-pickup-failed', 'staff-charge-failed', 'staff-weight-claim'])
    const { docs } = await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'sendShopEmail' } }, limit: 0, pagination: false })
    const claim = docs.map((job) => job.input as { kind: string; orderId: number; details?: string }).find((input) => input.orderId === pickup.order.id && input.kind === 'staff-weight-claim')
    expect(claim?.details).toBe('Amount claimed: ₦1,500.')
  })

  it('acknowledges events for unknown shipments and events it does not use', async () => {
    const warn = vi.spyOn(payload.logger, 'warn').mockImplementation(() => undefined)
    expect((await send(event('shipment.delivered', 'SH-nobody'))).status).toBe(200)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('SH-nobody'))
    const { order, shipmentId } = await bookedOrder()
    expect((await send(event('shipment.label-created', shipmentId))).status).toBe(200)
    expect((await reload(order)).status).toBe('courier-booked')
  })

  it('finds the shipment where the docs put it for pickups, charges and weight claims', async () => {
    const { order, shipmentId } = await bookedOrder()
    await send({ event: 'pickup.failed', event_id: `evt-pf-${shipmentId}`, data: { pickup_id: 'PU-1', shipment_ids: [shipmentId] } })
    await send({ event: 'transaction.failed', data: { id: 'Qm8z', transaction_id: 'TR-1', shipment: shipmentId } })
    await send({ event: 'reconciliation.flagged', data: { shipment_id: shipmentId, exception_charge: 9370 } })
    expect(await emailKinds(order)).toEqual(['staff-pickup-failed', 'staff-charge-failed', 'staff-weight-claim'])
  })

  it('does not mark an event as seen when applying it fails, so the retry applies it', async () => {
    const { order, shipmentId } = await bookedOrder()
    const once = event('shipment.in-transit', shipmentId)
    const real = payload.update.bind(payload)
    let failed = false
    vi.spyOn(payload, 'update').mockImplementation(((args: { collection: string; id?: number | string }) => {
      if (!failed && args.collection === 'orders' && args.id === order.id) {
        failed = true
        return Promise.reject(new Error('The database dropped the write.'))
      }
      return real(args as never)
    }) as never)
    try {
      const error = vi.spyOn(payload.logger, 'error').mockImplementation(() => undefined)
      expect((await send(once)).status).toBe(500)
      expect(error).toHaveBeenCalled()
    } finally {
      vi.restoreAllMocks()
    }
    expect((await reload(order)).status).toBe('courier-booked')
    expect((await send(once)).status).toBe(200)
    expect((await reload(order)).status).toBe('in-transit')
  })

  it('applies an event delivered twice at the same moment once', async () => {
    const { order, shipmentId } = await bookedOrder()
    const once = event('shipment.in-transit', shipmentId)
    const before = (await reload(order)).history?.length ?? 0
    const answers = await Promise.all([send(once), send(once)])
    expect(answers.map((answer) => answer.status)).toEqual([200, 200])
    const after = await reload(order)
    expect(after.status).toBe('in-transit')
    expect((after.history?.length ?? 0) - before).toBe(1)
  })
})
