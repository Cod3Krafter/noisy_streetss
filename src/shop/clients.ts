import { createPaystackClient, type PaystackClient } from '@/shop/paystack'
import { createTerminalClient, TERMINAL_SANDBOX, type TerminalClient } from '@/shop/terminal'

export type ShopClients = { paystack: PaystackClient; terminal: TerminalClient }

let replacement: ShopClients | null = null

/** For tests only: every shop call then goes to these fakes. Pass null to go back to the real services. */
export function setShopClients(clients: ShopClients | null): void {
  replacement = clients
}

function setting(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not set.`)
  return value
}

/** The Paystack and Terminal clients, built from the settings each time so a changed key takes effect. */
export function shopClients(): ShopClients {
  if (replacement) return replacement
  return {
    paystack: createPaystackClient(setting('PAYSTACK_SECRET_KEY')),
    terminal: createTerminalClient(setting('TERMINAL_SECRET_KEY'), process.env.TERMINAL_BASE_URL?.trim() || TERMINAL_SANDBOX),
  }
}
