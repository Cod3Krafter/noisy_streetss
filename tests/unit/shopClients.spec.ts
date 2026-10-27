import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { createPaystackClient, PaystackError } from '@/shop/paystack'
import { signatureMatches } from '@/shop/signatures'
import { createTerminalClient, TerminalError } from '@/shop/terminal'

type Call = { url: string; method: string; headers: Headers; body: unknown }

/** A stand-in for fetch that records each call and answers with `reply`. */
function fakeFetch(reply: (call: Call) => { status?: number; body: unknown }) {
  const calls: Call[] = []
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const call = {
      url: String(url),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }
    calls.push(call)
    const { status = 200, body } = reply(call)
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }) as typeof fetch
  return { calls, fetchImpl }
}

describe('the Paystack client', () => {
  it('starts a payment in kobo with the secret key', async () => {
    const { calls, fetchImpl } = fakeFetch(() => ({ body: { status: true, data: { authorization_url: 'https://checkout.paystack.com/abc' } } }))
    const client = createPaystackClient('sk_test_x', fetchImpl)
    const result = await client.initialize({
      email: 'ada@example.com',
      amountKobo: 1_320_000,
      reference: 'ns_ref',
      callbackUrl: 'https://site.test/checkout/complete',
      metadata: { orderId: 4 },
    })
    expect(result).toEqual({ authorizationUrl: 'https://checkout.paystack.com/abc' })
    expect(calls[0].url).toBe('https://api.paystack.co/transaction/initialize')
    expect(calls[0].method).toBe('POST')
    expect(calls[0].headers.get('authorization')).toBe('Bearer sk_test_x')
    expect(calls[0].body).toEqual({
      email: 'ada@example.com',
      amount: 1_320_000,
      reference: 'ns_ref',
      callback_url: 'https://site.test/checkout/complete',
      metadata: { orderId: 4 },
    })
  })

  it('reads a verified payment, fee and pre-fee amount included', async () => {
    const { calls, fetchImpl } = fakeFetch(() => ({
      body: {
        status: true,
        data: { reference: 'ns_ref', status: 'success', currency: 'NGN', amount: 1_340_000, requested_amount: 1_320_000, fees: 20_000, channel: 'card', paid_at: '2026-10-27T10:25:06.000Z' },
      },
    }))
    const payment = await createPaystackClient('sk_test_x', fetchImpl).verify('ns_ref')
    expect(calls[0].url).toBe('https://api.paystack.co/transaction/verify/ns_ref')
    expect(payment).toEqual({
      reference: 'ns_ref',
      status: 'success',
      currency: 'NGN',
      amountKobo: 1_340_000,
      requestedAmountKobo: 1_320_000,
      feesKobo: 20_000,
      channel: 'card',
      paidAt: '2026-10-27T10:25:06.000Z',
    })
  })

  it('turns a refusal or an outage into a PaystackError', async () => {
    const refused = fakeFetch(() => ({ status: 400, body: { status: false, message: 'Invalid key' } }))
    await expect(createPaystackClient('bad', refused.fetchImpl).verify('x')).rejects.toThrow(PaystackError)
    const down = (async () => {
      throw new Error('ECONNRESET')
    }) as unknown as typeof fetch
    await expect(createPaystackClient('sk', down).verify('x')).rejects.toThrow('Paystack could not be reached')
  })
})

describe('the Terminal client', () => {
  const parcel = { packagingId: 'PA-BOX', items: [{ name: 'Book (Paperback)', valueNGN: 12500, quantity: 2, weightGrams: 420 }] }
  const rate = { rate_id: 'RT-1', carrier_name: 'GIG Logistics', carrier_slug: 'gig', delivery_eta: '2 to 3 days', amount: 3200 }

  it('asks for quick quotes with only the city and state, and reads the rates in kobo', async () => {
    const { calls, fetchImpl } = fakeFetch(() => ({ body: { status: true, data: [rate, { ...rate, rate_id: '', amount: 0 }] } }))
    const client = createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl)
    const rates = await client.quotes({ bookable: false, pickup: { city: 'Ikeja', state: 'lagos' }, delivery: { city: 'Wuse', state: 'fct' }, parcel })
    expect(rates).toEqual([{ rateId: 'RT-1', carrierName: 'GIG Logistics', carrierSlug: 'gig', estimate: '2 to 3 days', amountKobo: 320_000 }])
    expect(calls[0].url).toBe('https://sandbox.test/v1/rates/shipment/quotes')
    expect(calls[0].headers.get('authorization')).toBe('Bearer tk')
    expect(calls[0].body).toEqual({
      pickup_address: { city: 'Ikeja', state: 'Lagos', country: 'NG' },
      delivery_address: { city: 'Wuse', state: 'Federal Capital Territory', country: 'NG' },
      parcel: {
        description: 'Books and merch from Noisy Streetss',
        packaging: 'PA-BOX',
        weight_unit: 'kg',
        items: [{ name: 'Book (Paperback)', description: 'Book (Paperback)', currency: 'NGN', value: 12500, quantity: 2, weight: 0.42 }],
      },
      currency: 'NGN',
      persist_data: false,
    })
  })

  it('asks for bookable quotes with full addresses', async () => {
    const { calls, fetchImpl } = fakeFetch(() => ({ body: { status: true, data: [rate] } }))
    const contact = { name: 'Ada Ngozi Obi', email: 'ada@example.com', phone: '+2348031234567', line1: '5 Allen Avenue', line2: null, city: 'Ikeja', state: 'lagos', postcode: '100271' }
    await createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl).quotes({ bookable: true, pickup: contact, delivery: contact, parcel })
    const body = calls[0].body as { delivery_address: unknown; persist_data: boolean }
    expect(body.persist_data).toBe(true)
    expect(body.delivery_address).toEqual({
      city: 'Ikeja',
      state: 'Lagos',
      country: 'NG',
      first_name: 'Ada',
      last_name: 'Ngozi Obi',
      email: 'ada@example.com',
      phone: '+2348031234567',
      line1: '5 Allen Avenue',
      zip: '100271',
    })
  })

  it('reads the wallet, a rate and a booking', async () => {
    const { calls, fetchImpl } = fakeFetch(({ url }) => {
      if (url.endsWith('/users/wallet-balance')) return { body: { status: true, data: { amount: 18500, currency: 'NGN' } } }
      if (url.endsWith('/rates/RT-1')) return { body: { status: true, data: rate } }
      return {
        body: {
          status: true,
          data: { shipment_id: 'SH-9', extras: { tracking_number: '129', tracking_url: 'https://track.test/129', shipping_label_url: 'https://label.test/SH-9.pdf' } },
        },
      }
    })
    const client = createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl)
    expect(await client.walletBalance()).toEqual({ amountKobo: 1_850_000 })
    expect((await client.getRate('RT-1')).amountKobo).toBe(320_000)
    expect(await client.book('RT-1')).toEqual({
      shipmentId: 'SH-9',
      trackingNumber: '129',
      trackingUrl: 'https://track.test/129',
      labelUrl: 'https://label.test/SH-9.pdf',
    })
    expect(calls[2]).toMatchObject({ url: 'https://sandbox.test/v1/shipments/pickup', method: 'POST', body: { rate_id: 'RT-1' } })
  })

  it("passes on Terminal's own refusal message", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 400, body: { status: false, message: 'Insufficient wallet balance' } }))
    await expect(createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl).book('RT-1')).rejects.toThrow(
      new TerminalError('Terminal said: Insufficient wallet balance'),
    )
  })
})

describe('webhook signatures', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'ns_ref' } })
  const signed = createHmac('sha512', 'secret').update(body).digest('hex')

  it('accept the HMAC-SHA512 of the raw body made with the secret', () => {
    expect(signatureMatches(body, signed, 'secret')).toBe(true)
    expect(signatureMatches(body, signed.toUpperCase(), 'secret')).toBe(true)
  })

  it('refuse anything else', () => {
    expect(signatureMatches(body, signed, 'another secret')).toBe(false)
    expect(signatureMatches(`${body} `, signed, 'secret')).toBe(false)
    expect(signatureMatches(body, null, 'secret')).toBe(false)
    expect(signatureMatches(body, signed, undefined)).toBe(false)
    expect(signatureMatches(body, 'short', 'secret')).toBe(false)
  })
})
