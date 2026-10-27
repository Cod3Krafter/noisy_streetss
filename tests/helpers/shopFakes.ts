import { setShopClients } from '@/shop/clients'
import { type PaystackClient, PaystackError, type PaystackTransaction } from '@/shop/paystack'
import { type QuoteRequest, type TerminalBooking, type TerminalClient, TerminalError, type TerminalRate } from '@/shop/terminal'

type InitializeInput = Parameters<PaystackClient['initialize']>[0]

/** Paystack as the tests want it: nothing is paid until `pay` says so. */
export class FakePaystack implements PaystackClient {
  initialized: InitializeInput[] = []
  verifyCalls = 0
  failInitialize = false
  failVerify = false
  private payments = new Map<string, Partial<PaystackTransaction>>()

  async initialize(input: InitializeInput) {
    if (this.failInitialize) throw new PaystackError('Paystack is down (fake).')
    this.initialized.push(input)
    return { authorizationUrl: `https://checkout.paystack.test/${input.reference}` }
  }

  /** Marks a reference paid. By default for the amount checkout asked for, with Paystack's fee on top. */
  pay(reference: string, overrides: Partial<PaystackTransaction> = {}): void {
    const asked = this.initialized.find((entry) => entry.reference === reference)?.amountKobo ?? 0
    const fee = Math.round(asked * 0.015) + 10_000
    this.payments.set(reference, {
      status: 'success',
      currency: 'NGN',
      requestedAmountKobo: asked,
      amountKobo: asked + fee,
      feesKobo: fee,
      channel: 'card',
      paidAt: new Date().toISOString(),
      ...overrides,
    })
  }

  async verify(reference: string): Promise<PaystackTransaction> {
    this.verifyCalls += 1
    if (this.failVerify) throw new PaystackError('Paystack could not be reached (fake).')
    const payment = this.payments.get(reference)
    return {
      reference,
      status: payment?.status ?? 'abandoned',
      currency: payment?.currency ?? 'NGN',
      amountKobo: payment?.amountKobo ?? 0,
      requestedAmountKobo: payment?.requestedAmountKobo ?? 0,
      feesKobo: payment?.feesKobo ?? 0,
      channel: payment?.channel ?? null,
      paidAt: payment?.paidAt ?? null,
    }
  }
}

/** Terminal as the tests want it: two couriers, a well-funded wallet, bookings that succeed. */
export class FakeTerminal implements TerminalClient {
  rates: TerminalRate[] = [
    { rateId: 'rate-dhl', carrierName: 'DHL', carrierSlug: 'dhl', estimate: '1 to 2 days', amountKobo: 790_000 },
    { rateId: 'rate-gig', carrierName: 'GIG Logistics', carrierSlug: 'gig', estimate: '2 to 3 days', amountKobo: 335_000 },
  ]
  quoteCalls: QuoteRequest[] = []
  bookings: string[] = []
  walletKobo = 5_000_000
  failQuotes = false
  failBooking = false
  bookingDelayMs = 0

  async quotes(input: QuoteRequest) {
    this.quoteCalls.push(input)
    if (this.failQuotes) throw new TerminalError('Terminal could not be reached (fake).')
    return this.rates.map((rate) => ({ ...rate }))
  }

  async getRate(rateId: string) {
    const rate = this.rates.find((candidate) => candidate.rateId === rateId)
    if (!rate) throw new TerminalError('Terminal said: Rate not found')
    return { ...rate }
  }

  async walletBalance() {
    return { amountKobo: this.walletKobo }
  }

  async book(rateId: string): Promise<TerminalBooking> {
    if (this.bookingDelayMs) await new Promise((resolve) => setTimeout(resolve, this.bookingDelayMs))
    if (this.failBooking) throw new TerminalError('Terminal said: Booking refused (fake)')
    this.bookings.push(rateId)
    const number = this.bookings.length
    return {
      shipmentId: `SH-${number}-${rateId}`,
      trackingNumber: `TRK${number}`,
      trackingUrl: `https://track.test/TRK${number}`,
      labelUrl: `https://label.test/SH-${number}.pdf`,
    }
  }
}

/** Installs fresh fakes for every shop call and returns them. Call setShopClients(null) in afterAll. */
export function useFakeShopClients(): { paystack: FakePaystack; terminal: FakeTerminal } {
  const paystack = new FakePaystack()
  const terminal = new FakeTerminal()
  setShopClients({ paystack, terminal })
  return { paystack, terminal }
}
