import { Forbidden, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { SHOP_SERVER } from '@/shop/context'

import { createImage, createStaff, createWriter, expectFieldError, getTestPayload, rest, tokenFor } from '../helpers/payload'
import { createOrder } from '../helpers/shop'

let payload: Payload
let admin: User
let editor: User
let shop: User

beforeAll(async () => {
  payload = await getTestPayload()
  admin = await createStaff(payload, 'admin')
  editor = await createStaff(payload, 'editor')
  shop = await createStaff(payload, 'shop')
})

describe('orders', () => {
  it('get their number from their id', async () => {
    const order = await createOrder(payload)
    expect(order.orderNumber).toBe(`NS-${Number(order.id) + 1000}`)
    const stored = await payload.findByID({ collection: 'orders', id: order.id })
    expect(stored.orderNumber).toBe(order.orderNumber)
  })

  it('are never created through the API, even by an admin', async () => {
    const res = await rest('POST', '/orders', { body: { customerName: 'Mallory' } })
    expect(res.status).toBe(403)
    await expect(
      payload.create({ collection: 'orders', data: { customerName: 'Mallory' } as never, overrideAccess: false, user: admin }),
    ).rejects.toBeInstanceOf(Forbidden)
  })

  it('are read by admins and shop staff, and not by editors or visitors', async () => {
    const order = await createOrder(payload)
    for (const user of [admin, shop]) {
      const found = await payload.findByID({ collection: 'orders', id: order.id, overrideAccess: false, user })
      expect(found.id).toBe(order.id)
    }
    await expect(payload.find({ collection: 'orders', overrideAccess: false, user: editor })).rejects.toBeInstanceOf(Forbidden)
    expect((await rest('GET', `/orders/${order.id}`)).status).toBe(403)
  })

  it('are never deleted, even by an admin', async () => {
    const order = await createOrder(payload, { status: 'expired' })
    await expect(payload.delete({ collection: 'orders', id: order.id, overrideAccess: false, user: admin })).rejects.toBeInstanceOf(Forbidden)
  })

  it('record who set a status by hand', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    const updated = await payload.update({ collection: 'orders', id: order.id, data: { status: 'refunded' }, overrideAccess: false, user: shop })
    expect(updated.status).toBe('refunded')
    expect(updated.history?.at(-1)).toMatchObject({ from: 'paid', to: 'refunded', by: shop.name, note: 'Set by hand' })
    expect(updated.history).toHaveLength(2)
  })

  it('keep money and payment fields as they were when staff send changes', async () => {
    const order = await createOrder(payload)
    const updated = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { totalNGN: 1, payment: { reference: 'forged' }, staffNotes: 'Called the customer' },
      overrideAccess: false,
      user: shop,
    })
    expect(updated.totalNGN).toBe(13200)
    expect(updated.payment?.reference).toBe(order.payment?.reference)
    expect(updated.staffNotes).toBe('Called the customer')
  })

  it('let staff correct the address only while Paid and unbooked', async () => {
    const paid = await createOrder(payload, { status: 'paid' })
    const moved = await payload.update({
      collection: 'orders',
      id: paid.id,
      data: { address: { ...paid.address, line1: '7 Allen Avenue' } },
      overrideAccess: false,
      user: shop,
    })
    expect(moved.address?.line1).toBe('7 Allen Avenue')

    const booked = await createOrder(payload, { status: 'courier-booked', shipment: { terminalShipmentId: 'SH-1' } })
    await expectFieldError(
      payload.update({ collection: 'orders', id: booked.id, data: { customerPhone: '+2348000000009' }, overrideAccess: false, user: shop }),
      'customerPhone',
      /only be changed while the order is Paid/,
    )
  })

  it('refuse a change to the history', async () => {
    const order = await createOrder(payload)
    await expectFieldError(
      payload.update({ collection: 'orders', id: order.id, data: { history: [] }, overrideAccess: false, user: admin }),
      'history',
      /^The history can only be added to, never changed.$/,
    )
    await expectFieldError(
      payload.update({
        collection: 'orders',
        id: order.id,
        data: { history: [...(order.history ?? []), { at: new Date().toISOString(), to: 'paid', by: 'Forged' }] },
        overrideAccess: false,
        user: admin,
      }),
      'history',
      /^The history can only be added to by the shop itself.$/,
    )
  })

  it('keep their date when staff send a different one', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    const updated = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { createdAt: '2020-01-01T00:00:00.000Z', staffNotes: 'Backdated?' },
      overrideAccess: false,
      user: shop,
    })
    expect(updated.createdAt).toBe(order.createdAt)
    const withStatus = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { createdAt: '2020-01-01T00:00:00.000Z', status: 'refunded' },
      overrideAccess: false,
      user: shop,
    })
    expect(withStatus.createdAt).toBe(order.createdAt)
  })

  it('treat an empty text and no text as the same when the address is sent back', async () => {
    const order = await createOrder(payload, { status: 'delivered', address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos', postcode: '' } })
    const updated = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { address: { ...order.address, line2: '', postcode: null }, staffNotes: 'Saved from the form' },
      overrideAccess: false,
      user: shop,
    })
    expect(updated.staffNotes).toBe('Saved from the form')
    const again = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { address: { ...order.address, line2: null, postcode: '' }, customerPhone: order.customerPhone, staffNotes: 'Again' },
      overrideAccess: false,
      user: shop,
    })
    expect(again.staffNotes).toBe('Again')
  })

  it('tell staff when the order changed while the form was open', async () => {
    const order = await createOrder(payload)
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { history: [...(order.history ?? []), { at: new Date().toISOString(), to: 'paid', by: 'Payment' }] },
      context: { [SHOP_SERVER]: true },
    })
    await expectFieldError(
      payload.update({ collection: 'orders', id: order.id, data: { history: order.history }, overrideAccess: false, user: shop }),
      'history',
      /^This order changed while it was open\. Reload it and try again\.$/,
    )
  })

  it('refuse an edit of a history entry in place', async () => {
    const order = await createOrder(payload)
    await expectFieldError(
      payload.update({
        collection: 'orders',
        id: order.id,
        data: { history: (order.history ?? []).map((row) => ({ ...row, by: 'Someone else' })) },
        overrideAccess: false,
        user: admin,
      }),
      'history',
      /^The history can only be added to, never changed\.$/,
    )
  })

  it('let server code add a history entry, and refuse it editing one', async () => {
    const order = await createOrder(payload)
    const added = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { history: [...(order.history ?? []), { at: new Date().toISOString(), from: 'awaiting-payment', to: 'paid', by: 'Payment' }] },
      context: { [SHOP_SERVER]: true },
    })
    expect(added.history).toHaveLength(2)
    await expectFieldError(
      payload.update({
        collection: 'orders',
        id: order.id,
        data: { history: (added.history ?? []).map((row) => ({ ...row, by: 'Rewritten' })) },
        context: { [SHOP_SERVER]: true },
      }),
      'history',
      /^The history can only be added to, never changed\.$/,
    )
  })

  it('refuse a phone or address change once a courier is booked, even while Paid', async () => {
    const order = await createOrder(payload, { status: 'paid', shipment: { terminalShipmentId: 'SH-2' } })
    await expectFieldError(
      payload.update({ collection: 'orders', id: order.id, data: { customerPhone: '+2348000000008' }, overrideAccess: false, user: shop }),
      'customerPhone',
      /only be changed while the order is Paid/,
    )
    await expectFieldError(
      payload.update({
        collection: 'orders',
        id: order.id,
        data: { address: { ...order.address, line1: '9 Allen Avenue' } },
        overrideAccess: false,
        user: shop,
      }),
      'address',
      /only be changed while the order is Paid/,
    )
  })

  it('refuse a phone or address change while a booking is in progress, and allow it once the claim has lapsed', async () => {
    const held = await createOrder(payload, { status: 'paid', shipment: { bookingStartedAt: new Date(Date.now() - 60_000).toISOString() } })
    for (const data of [{ customerPhone: '+2348000000007' }, { address: { ...held.address, line1: '11 Allen Avenue' } }]) {
      await expectFieldError(
        payload.update({ collection: 'orders', id: held.id, data, overrideAccess: false, user: shop }),
        'customerPhone' in data ? 'customerPhone' : 'address',
        /^A booking is in progress\. Wait for it to finish, then change the address\.$/,
      )
    }
    const lapsed = await createOrder(payload, { status: 'paid', shipment: { bookingStartedAt: new Date(Date.now() - 6 * 60_000).toISOString() } })
    const moved = await payload.update({
      collection: 'orders',
      id: lapsed.id,
      data: { address: { ...lapsed.address, line1: '11 Allen Avenue' } },
      overrideAccess: false,
      user: shop,
    })
    expect(moved.address?.line1).toBe('11 Allen Avenue')
  })

  it('check a changed phone number by the checkout rule, and store it as +234', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    for (const customerPhone of ['+44 7700 900123', '0803', '']) {
      await expectFieldError(
        payload.update({ collection: 'orders', id: order.id, data: { customerPhone }, overrideAccess: false, user: shop }),
        'customerPhone',
        /^Enter a Nigerian phone number, such as 0803 123 4567\.$/,
      )
    }
    const updated = await payload.update({ collection: 'orders', id: order.id, data: { customerPhone: '0805 111 2222' }, overrideAccess: false, user: shop })
    expect(updated.customerPhone).toBe('+2348051112222')
  })

  it('refuse a postcode that is not six digits, and allow an empty one', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    for (const postcode of ['1234', '10027a', '1002711']) {
      await expectFieldError(
        payload.update({ collection: 'orders', id: order.id, data: { address: { ...order.address, postcode } }, overrideAccess: false, user: shop }),
        'address.postcode',
        /^A Nigerian postcode has six digits\. Leave it empty if you are not sure\.$/,
      )
    }
    const cleared = await payload.update({ collection: 'orders', id: order.id, data: { address: { ...order.address, postcode: '' } }, overrideAccess: false, user: shop })
    expect(cleared.address?.postcode || null).toBeNull()
    const set = await payload.update({ collection: 'orders', id: order.id, data: { address: { ...order.address, postcode: '100001' } }, overrideAccess: false, user: shop })
    expect(set.address?.postcode).toBe('100001')
  })

  it('refuse any change by an editor', async () => {
    const order = await createOrder(payload, { status: 'paid' })
    await expect(
      payload.update({ collection: 'orders', id: order.id, data: { staffNotes: 'Editor was here' }, overrideAccess: false, user: editor }),
    ).rejects.toBeInstanceOf(Forbidden)
    expect((await rest('PATCH', `/orders/${order.id}`, { token: await tokenFor(payload, editor), body: { staffNotes: 'Editor was here' } })).status).toBe(403)
    expect((await payload.findByID({ collection: 'orders', id: order.id })).staffNotes ?? null).toBeNull()
  })

  it('let an ordered book be deleted, keeping the order line as it was bought', async () => {
    const book = await payload.create({
      collection: 'books',
      data: {
        title: 'Soon Deleted',
        cover: (await createImage(payload)).id,
        writers: [(await createWriter(payload)).id],
        category: 'fiction',
        summary: 'A book that goes.',
        formats: [{ formatName: 'Paperback', priceNGN: 9000, inStock: true, weightGrams: 300 }],
        sellInShop: true,
        _status: 'published',
      },
    })
    const order = await createOrder(payload, {
      items: [{ product: { relationTo: 'books', value: book.id }, title: 'Soon Deleted', optionName: 'Paperback', unitPriceNGN: 9000, quantity: 1, weightGrams: 300 }],
    })
    await payload.delete({ collection: 'books', id: book.id, overrideAccess: false, user: admin })
    const after = await payload.findByID({ collection: 'orders', id: order.id, depth: 0 })
    expect(after.items?.[0]?.product ?? null).toBeNull()
    expect(after.items?.[0]?.title).toBe('Soon Deleted')
    expect(after.items?.[0]?.unitPriceNGN).toBe(9000)
  })
})
