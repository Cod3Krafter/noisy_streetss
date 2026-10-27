import { createLocalReq, type Payload } from 'payload'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { queueShopEmail } from '@/shop/emails'

import { getTestPayload } from '../helpers/payload'
import { createOrder, setShopSettings } from '../helpers/shop'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
  await setShopSettings(payload)
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { contactEmail: 'hello@noisystreetss.test', formAlertEmail: 'inbox@noisystreetss.test', phone: '+234 800 000 0000' },
  })
})

afterEach(() => vi.restoreAllMocks())

/** Queues one shop email and runs just that job. */
async function queueAndRun(input: Parameters<typeof queueShopEmail>[1]) {
  const req = await createLocalReq({}, payload)
  await queueShopEmail(req, input)
  const { docs } = await payload.find({ collection: 'payload-jobs', where: { taskSlug: { equals: 'sendShopEmail' } }, sort: '-id', limit: 1 })
  await payload.jobs.runByID({ id: docs[0].id })
}

describe('shop emails', () => {
  it("send the receipt to the customer's address", async () => {
    const sent = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined as never)
    const order = await createOrder(payload, { status: 'paid' })
    await queueAndRun({ kind: 'receipt', orderId: order.id })
    expect(sent).toHaveBeenCalledWith(expect.objectContaining({ to: 'ada@example.com', subject: `Your Noisy Streetss order ${order.orderNumber}` }))
  })

  it('send staff alerts to the order alert address, and skip them when none is set', async () => {
    const sent = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined as never)
    const order = await createOrder(payload, { status: 'paid' })
    await queueAndRun({ kind: 'staff-paid', orderId: order.id })
    expect(sent).toHaveBeenCalledWith(expect.objectContaining({ to: 'orders@noisystreetss.test' }))

    sent.mockClear()
    await setShopSettings(payload, { orderAlertEmail: null })
    const warned = vi.spyOn(payload.logger, 'warn')
    await queueAndRun({ kind: 'staff-paid', orderId: order.id })
    expect(sent).not.toHaveBeenCalled()
    expect(warned).toHaveBeenCalledWith(expect.stringContaining('was not sent'))
    await setShopSettings(payload)
  })
})
