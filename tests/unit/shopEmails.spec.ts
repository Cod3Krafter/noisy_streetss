import { describe, expect, it } from 'vitest'

import type { Order } from '@/payload-types'
import { buildShopEmail } from '@/shop/emails'

const order = {
  id: 42,
  orderNumber: 'NS-1042',
  status: 'paid',
  customerName: 'Ada Obi',
  customerEmail: 'ada@example.com',
  address: { line1: '5 Allen Avenue', city: 'Ikeja', state: 'lagos', postcode: '100271' },
  items: [
    { title: 'The River Girl', optionName: 'Paperback', unitPriceNGN: 12500, quantity: 2, weightGrams: 420 },
    { title: 'Noisy Streetss T-shirt', optionName: 'M', unitPriceNGN: 15000, quantity: 1, weightGrams: 250 },
  ],
  delivery: { method: 'courier', carrierName: 'GIG Logistics', estimate: '2 to 3 days', priceNGN: 3200 },
  itemsNGN: 40000,
  deliveryNGN: 3200,
  totalNGN: 43200,
  paystackFeeNGN: 748,
  chargedNGN: 43948,
  payment: { reference: 'ns_x', paidLate: false },
  shipment: { carrierName: 'DHL', trackingNumber: 'TRK1', trackingUrl: 'https://track.test/TRK1' },
} as unknown as Order

const contact = { email: 'hello@noisystreetss.test', phone: '+234 800 000 0000' }

describe('shop emails', () => {
  it('give the customer a full receipt', () => {
    const email = buildShopEmail(order, { kind: 'receipt', orderId: 42 }, contact)
    expect(email.audience).toBe('customer')
    expect(email.subject).toBe('Your Noisy Streetss order NS-1042')
    for (const line of [
      'Thank you, Ada.',
      '2 x The River Girl (Paperback): ₦25,000',
      '1 x Noisy Streetss T-shirt (M): ₦15,000',
      'Delivery (GIG Logistics, 2 to 3 days): ₦3,200',
      'Paystack fee: ₦748',
      'Total paid: ₦43,948',
      'Delivering to: 5 Allen Avenue, Ikeja, Lagos',
      'Email hello@noisystreetss.test or call +234 800 000 0000, quoting NS-1042',
    ]) {
      expect(email.text).toContain(line)
    }
    expect(email.html).toContain('<p>2 x The River Girl (Paperback): ₦25,000</p>')
  })

  it('tell the customer which courier was booked, with the tracking link', () => {
    const email = buildShopEmail(order, { kind: 'tracking', orderId: 42 }, contact)
    expect(email.subject).toBe('Your order NS-1042 has been booked with DHL')
    expect(email.text).toContain('Tracking number: TRK1')
    expect(email.text).toContain('https://track.test/TRK1')
  })

  it('alert staff, with a link to the order and any details', () => {
    const late = { ...order, payment: { ...order.payment, paidLate: true } } as Order
    const paid = buildShopEmail(late, { kind: 'staff-paid', orderId: 42 }, contact)
    expect(paid.audience).toBe('staff')
    expect(paid.subject).toBe('New paid order NS-1042 (paid after it expired)')
    expect(paid.text).toContain('/admin/collections/orders/42')
    const mismatch = buildShopEmail(order, { kind: 'staff-mismatch', orderId: 42, details: 'Paystack reported ₦1.' }, contact)
    expect(mismatch.text).toContain('Paystack reported ₦1.')
    const weight = buildShopEmail(order, { kind: 'staff-weight-claim', orderId: 42 }, contact)
    expect(weight.text).toContain('7 days')
  })

  it('escape names in the HTML', () => {
    const odd = { ...order, customerName: '<b>Ada</b>' } as Order
    expect(buildShopEmail(odd, { kind: 'receipt', orderId: 42 }, contact).html).not.toContain('<b>Ada</b>')
  })
})
