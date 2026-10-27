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

/** A booking request that got no answer (or an answer without a shipment ID): the parcel may be booked. */
export class TerminalOutcomeUnknown extends TerminalError {
  constructor(message: string) {
    super(message)
    this.name = 'TerminalOutcomeUnknown'
  }
}

export type TerminalPlace ={ city: string; state: string }
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
  const [first = 'Customer', ...rest] = person.name.split(/\s+/).filter(Boolean)
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

/** A naira amount as a finite number, or null when it is missing or not numeric. */
function nairaAmount(value: unknown): number | null {
  const number = typeof value === 'string' && value.trim() ? Number(value) : value
  return typeof number === 'number' && Number.isFinite(number) ? number : null
}

function amountKoboOf(value: unknown): number {
  const naira = nairaAmount(value)
  if (naira === null) throw new TerminalError('Terminal sent an amount that is not a number.')
  // Pending checks P5 and P6: Terminal's amounts are assumed to be naira.
  return toKobo(naira)
}

function rateFrom(raw: Record<string, unknown>): TerminalRate {
  const carrierName = String(raw.carrier_name ?? 'Courier')
  return {
    rateId: String(raw.rate_id ?? raw.id ?? ''),
    carrierName,
    carrierSlug: String(raw.carrier_slug ?? carrierName.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
    estimate: String(raw.delivery_eta ?? raw.delivery_time ?? ''),
    amountKobo: amountKoboOf(raw.amount),
  }
}

const text = (value: unknown) => (typeof value === 'string' && value ? value : null)

export function createTerminalClient(secretKey: string, baseUrl: string, fetchImpl: typeof fetch = fetch): TerminalClient {
  async function call(method: string, path: string, body?: unknown, timeoutMs = TIMEOUT_MS, unconfirmedIfNoAnswer = false): Promise<unknown> {
    let response: Response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      // Only the error's name: its message can quote the Authorization header, and so the key.
      const name = error instanceof Error ? error.name : 'Error'
      if (unconfirmedIfNoAnswer) throw new TerminalOutcomeUnknown(`Terminal did not confirm the booking (${name}). It may have gone through.`)
      throw new TerminalError(`Terminal could not be reached (${name}).`)
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
      if (!Array.isArray(data)) throw new TerminalError('Terminal sent quotes in an unexpected shape.')
      return data
        .filter((raw) => raw && typeof raw === 'object' && nairaAmount((raw as Record<string, unknown>).amount) !== null)
        .map((raw) => rateFrom(raw as Record<string, unknown>))
        .filter((rate) => rate.rateId && rate.amountKobo > 0)
    },

    async getRate(rateId) {
      return rateFrom((await call('GET', `/rates/${encodeURIComponent(rateId)}`)) as Record<string, unknown>)
    },

    async walletBalance() {
      const data = (await call('GET', '/users/wallet-balance')) as { amount?: unknown } | null
      // Pending check P5: the balance is assumed to be naira.
      return { amountKobo: amountKoboOf(data?.amount) }
    },

    async book(rateId) {
      const data = ((await call('POST', '/shipments/pickup', { rate_id: rateId }, TIMEOUT_MS, true)) ?? {}) as Record<string, unknown>
      const extras = (data.extras ?? {}) as Record<string, unknown>
      const shipmentId = text(data.shipment_id) ?? text(data.id)
      if (!shipmentId) throw new TerminalOutcomeUnknown('Terminal answered the booking but gave no shipment ID. It may have gone through.')
      return {
        shipmentId,
        trackingNumber: text(extras.tracking_number),
        trackingUrl: text(extras.tracking_url),
        labelUrl: text(extras.shipping_label_url),
      }
    },
  }
}
