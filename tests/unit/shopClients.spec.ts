import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { setShopClients, shopClients } from '@/shop/clients'
import { createPaystackClient, PaystackError } from '@/shop/paystack'
import { signatureMatches } from '@/shop/signatures'
import { createTerminalClient, TerminalError, TerminalOutcomeUnknown } from '@/shop/terminal'

/** A fetch that fails the way Node does, with the Authorization value quoted in the message. */
const leakyFetch = (secret: string, name = 'TypeError') =>
  (async () => {
    const error = new Error(`Invalid value "Bearer ${secret}" for header "Authorization"`)
    error.name = name
    throw error
  }) as unknown as typeof fetch

describe('keys and the real services', () => {
  const secret = 'sk_live_SECRETVALUE'

  it('never copies a failed fetch message (which can quote the key) into an error', async () => {
    await expect(createPaystackClient(secret, leakyFetch(secret)).verify('x')).rejects.toThrow('Paystack could not be reached (TypeError).')
    await expect(createPaystackClient(secret, leakyFetch(secret)).verify('x')).rejects.not.toThrow(/SECRETVALUE/)
    await expect(createTerminalClient(secret, 'https://t.test/v1', leakyFetch(secret, 'TimeoutError')).walletBalance()).rejects.toThrow(
      'Terminal could not be reached (TimeoutError).',
    )
  })

  it('refuses a key with a line break or space, naming only the variable', () => {
    const before = process.env.PAYSTACK_SECRET_KEY
    setShopClients(null)
    try {
      process.env.PAYSTACK_SECRET_KEY = 'sk_live_SECRET\nVALUE'
      // VITEST is set, so the guard would fire first; lift it for this check only.
      const vitest = process.env.VITEST
      delete process.env.VITEST
      try {
        expect(() => shopClients()).toThrow('PAYSTACK_SECRET_KEY has characters a key cannot contain, such as a line break. Paste it again.')
        expect(() => shopClients()).not.toThrow(/sk_live/)
      } finally {
        process.env.VITEST = vitest
      }
    } finally {
      process.env.PAYSTACK_SECRET_KEY = before
    }
  })

  it('throws when a test reaches the real clients without fakes', () => {
    setShopClients(null)
    expect(() => shopClients()).toThrow('A test reached the real shop clients. Install fakes with useFakeShopClients().')
  })
})

type Call = { url: string; method: string; headers: Headers; body: unknown; signal: AbortSignal | null | undefined }

/** A stand-in for fetch that records each call and answers with `reply`. */
function fakeFetch(reply: (call: Call) => { status?: number; body: unknown }) {
  const calls: Call[] = []
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const call = {
      url: String(url),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
      signal: init?.signal,
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

  it('refuses a reply with no payment link and sends a timeout signal', async () => {
    const { calls, fetchImpl } = fakeFetch(() => ({ body: { status: true, data: {} } }))
    const client = createPaystackClient('sk', fetchImpl)
    await expect(client.initialize({ email: 'a@b.co', amountKobo: 1, reference: 'r', callbackUrl: 'https://x.test', metadata: {} })).rejects.toThrow(PaystackError)
    expect(calls[0].signal).toBeInstanceOf(AbortSignal)
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
    const refused = createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl).book('RT-1')
    await expect(refused).rejects.toBeInstanceOf(TerminalError)
    await expect(refused).rejects.toThrow('Terminal said: Insufficient wallet balance')
    await expect(refused).rejects.not.toBeInstanceOf(TerminalOutcomeUnknown)
  })

  it('flags a booking as unconfirmed when no answer comes or no shipment ID is given', async () => {
    const down = createTerminalClient('tk', 'https://sandbox.test/v1', leakyFetch('tk', 'TimeoutError')).book('RT-1')
    await expect(down).rejects.toBeInstanceOf(TerminalOutcomeUnknown)
    await expect(down).rejects.toThrow('Terminal did not confirm the booking (TimeoutError). It may have gone through.')
    const { fetchImpl } = fakeFetch(() => ({ body: { status: true, data: {} } }))
    await expect(createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl).book('RT-1')).rejects.toBeInstanceOf(TerminalOutcomeUnknown)
  })

  it('refuses amounts that are not numbers for a rate or the wallet, and skips such rates in quotes', async () => {
    const odd = fakeFetch(({ url }) => ({ body: { status: true, data: url.includes('wallet') ? {} : { ...rate, amount: 'abc' } } }))
    const client = createTerminalClient('tk', 'https://sandbox.test/v1', odd.fetchImpl)
    await expect(client.getRate('RT-1')).rejects.toThrow('Terminal sent an amount that is not a number.')
    await expect(client.walletBalance()).rejects.toThrow('Terminal sent an amount that is not a number.')
    const quotes = fakeFetch(() => ({ body: { status: true, data: [{ ...rate, amount: 'abc' }, { ...rate, amount: undefined }, rate] } }))
    const rates = await createTerminalClient('tk', 'https://sandbox.test/v1', quotes.fetchImpl).quotes({
      bookable: false,
      pickup: { city: 'a', state: 'lagos' },
      delivery: { city: 'b', state: 'lagos' },
      parcel,
    })
    expect(rates).toHaveLength(1)
    expect(quotes.calls[0].signal).toBeInstanceOf(AbortSignal)
  })

  it('refuses a quotes reply that is not a list', async () => {
    const { fetchImpl } = fakeFetch(() => ({ body: { status: true, data: { rates: [] } } }))
    await expect(
      createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl).quotes({ bookable: false, pickup: { city: 'a', state: 'lagos' }, delivery: { city: 'b', state: 'lagos' }, parcel }),
    ).rejects.toThrow('Terminal sent quotes in an unexpected shape.')
  })

  it('falls back to "Customer" for a blank name', async () => {
    const { calls, fetchImpl } = fakeFetch(() => ({ body: { status: true, data: [rate] } }))
    const blank = { name: '   ', email: 'a@b.co', phone: '1', line1: 'x', city: 'Ikeja', state: 'lagos', postcode: '1' }
    await createTerminalClient('tk', 'https://sandbox.test/v1', fetchImpl).quotes({ bookable: true, pickup: blank, delivery: blank, parcel })
    expect(calls[0].body).toMatchObject({ delivery_address: { first_name: 'Customer', last_name: 'Customer' } })
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
