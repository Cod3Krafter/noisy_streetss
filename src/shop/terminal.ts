import { toKobo } from '@/shop/money'
import { terminalStateName } from '@/shop/states'

export const TERMINAL_SANDBOX = 'https://sandbox.terminal.africa/v1'
const QUOTE_TIMEOUT_MS = 8_000
const TIMEOUT_MS = 15_000

export class TerminalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TerminalError'
  }
}

export type TerminalPlace = { city: string; state: string }
export type TerminalContact = TerminalPlace & {
  name: string
  email: string
  phone: string
  line1: string
  line2?: string | null
  postcode: string
}
export type TerminalParcel = { packagingId: string; items: { name: string; valueNGN: number; quantity: number; weightGrams: number }[] }
export type TerminalRate = { rateId: string; carrierName: string; carrierSlug: string; estimate: string; amountKobo: number }
export type TerminalBooking = { shipmentId: string; trackingNumber: string | null; trackingUrl: string | null; labelUrl: string | null }

/** Quick quotes need only the city and state; bookable ones need full addresses (with a postcode). */
export type QuoteRequest =
  | { bookable: false; pickup: TerminalPlace; delivery: TerminalPlace; parcel: TerminalParcel }
  | { bookable: true; pickup: TerminalContact; delivery: TerminalContact; parcel: TerminalParcel }

export interface TerminalClient {
  quotes(input: QuoteRequest): Promise<TerminalRate[]>
  getRate(rateId: string): Promise<TerminalRate>
  walletBalance(): Promise<{ amountKobo: number }>
  book(rateId: string): Promise<TerminalBooking>
}

const place = (where: TerminalPlace) => ({ city: where.city, state: terminalStateName(where.state), country: 'NG' })

function contact(person: TerminalContact) {
  const [first = 'Customer', ...rest] = person.name.trim().split(/\s+/)
  return {
    ...place(person),
    first_name: first,
    last_name: rest.join(' ') || first,
    email: person.email,
    phone: person.phone,
    line1: person.line1,
    ...(person.line2 ? { line2: person.line2 } : {}),
    zip: person.postcode,
  }
}

const parcelJson = (parcel: TerminalParcel) => ({
  description: 'Books and merch from Noisy Streetss',
  packaging: parcel.packagingId,
  weight_unit: 'kg',
  items: parcel.items.map((item) => ({
    name: item.name,
    description: item.name,
    currency: 'NGN',
    value: item.valueNGN,
    quantity: item.quantity,
    weight: item.weightGrams / 1000,
  })),
})

function rateFrom(raw: Record<string, unknown>): TerminalRate {
  const carrierName = String(raw.carrier_name ?? 'Courier')
  return {
    rateId: String(raw.rate_id ?? raw.id ?? ''),
    carrierName,
    carrierSlug: String(raw.carrier_slug ?? carrierName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    estimate: String(raw.delivery_eta ?? raw.delivery_time ?? ''),
    // Pending checks P5 and P6: Terminal's amounts are assumed to be naira.
    amountKobo: toKobo(Number(raw.amount ?? 0)),
  }
}

const text = (value: unknown) => (typeof value === 'string' && value ? value : null)

export function createTerminalClient(secretKey: string, baseUrl: string, fetchImpl: typeof fetch = fetch): TerminalClient {
  async function call(method: string, path: string, body?: unknown, timeoutMs = TIMEOUT_MS): Promise<unknown> {
    let response: Response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      throw new TerminalError(`Terminal could not be reached (${error instanceof Error ? error.message : String(error)}).`)
    }
    const json = (await response.json().catch(() => null)) as { status?: boolean; message?: string; data?: unknown } | null
    if (!response.ok || !json || json.status === false) {
      throw new TerminalError(json?.message ? `Terminal said: ${json.message}` : `Terminal answered ${response.status}.`)
    }
    return json.data
  }

  return {
    async quotes(input) {
      const body = {
        pickup_address: input.bookable ? contact(input.pickup) : place(input.pickup),
        delivery_address: input.bookable ? contact(input.delivery) : place(input.delivery),
        parcel: parcelJson(input.parcel),
        currency: 'NGN',
        persist_data: input.bookable,
      }
      const data = await call('POST', '/rates/shipment/quotes', body, QUOTE_TIMEOUT_MS)
      return (Array.isArray(data) ? data : [])
        .map((raw) => rateFrom(raw as Record<string, unknown>))
        .filter((rate) => rate.rateId && rate.amountKobo > 0)
    },

    async getRate(rateId) {
      return rateFrom((await call('GET', `/rates/${encodeURIComponent(rateId)}`)) as Record<string, unknown>)
    },

    async walletBalance() {
      const data = (await call('GET', '/users/wallet-balance')) as { amount?: unknown } | null
      // Pending check P5: the balance is assumed to be naira.
      return { amountKobo: toKobo(Number(data?.amount ?? 0)) }
    },

    async book(rateId) {
      const data = ((await call('POST', '/shipments/pickup', { rate_id: rateId })) ?? {}) as Record<string, unknown>
      const extras = (data.extras ?? {}) as Record<string, unknown>
      const shipmentId = text(data.shipment_id) ?? text(data.id)
      if (!shipmentId) throw new TerminalError('Terminal booked the parcel but gave no shipment ID.')
      return {
        shipmentId,
        trackingNumber: text(extras.tracking_number),
        trackingUrl: text(extras.tracking_url),
        labelUrl: text(extras.shipping_label_url),
      }
    },
  }
}
