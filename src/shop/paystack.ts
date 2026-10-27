const BASE_URL = 'https://api.paystack.co'
const TIMEOUT_MS = 10_000

export class PaystackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaystackError'
  }
}

export type PaystackTransaction = {
  reference: string
  status: string
  currency: string
  amountKobo: number
  requestedAmountKobo: number
  feesKobo: number
  channel: string | null
  paidAt: string | null
}

export interface PaystackClient {
  initialize(input: {
    email: string
    amountKobo: number
    reference: string
    callbackUrl: string
    metadata: Record<string, unknown>
  }): Promise<{ authorizationUrl: string }>
  verify(reference: string): Promise<PaystackTransaction>
}

export function createPaystackClient(secretKey: string, fetchImpl: typeof fetch = fetch): PaystackClient {
  async function call(method: string, path: string, body?: unknown): Promise<Record<string, unknown>> {
    let response: Response
    try {
      response = await fetchImpl(`${BASE_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch (error) {
      // Only the error's name: its message can quote the Authorization header, and so the key.
      const code = (error as { cause?: { code?: unknown } } | null)?.cause?.code
      const name = `${error instanceof Error ? error.name : 'Error'}${typeof code === 'string' ? `: ${code}` : ''}`
      throw new PaystackError(`Paystack could not be reached (${name}).`)
    }
    const json = (await response.json().catch(() => null)) as { status?: boolean; message?: string; data?: unknown } | null
    if (!response.ok || !json?.status) throw new PaystackError(`Paystack refused ${path}: ${json?.message ?? response.status}.`)
    return (json.data ?? {}) as Record<string, unknown>
  }

  return {
    async initialize({ email, amountKobo, reference, callbackUrl, metadata }) {
      const data = await call('POST', '/transaction/initialize', { email, amount: amountKobo, reference, callback_url: callbackUrl, metadata })
      if (typeof data.authorization_url !== 'string') throw new PaystackError('Paystack gave no payment link.')
      return { authorizationUrl: data.authorization_url }
    },

    async verify(reference) {
      const data = await call('GET', `/transaction/verify/${encodeURIComponent(reference)}`)
      return {
        reference: String(data.reference ?? reference),
        status: String(data.status ?? ''),
        currency: String(data.currency ?? ''),
        amountKobo: Number(data.amount ?? 0),
        // Pending check P1: with "Pass fees to customers" on, this is the amount before Paystack's fee.
        requestedAmountKobo: Number(data.requested_amount ?? data.amount ?? 0),
        feesKobo: Number(data.fees ?? 0),
        channel: typeof data.channel === 'string' ? data.channel : null,
        paidAt: typeof data.paid_at === 'string' ? data.paid_at : null,
      }
    },
  }
}
