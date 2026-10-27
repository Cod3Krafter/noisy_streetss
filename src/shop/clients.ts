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
  // A line break or space inside a key breaks the header, and the error would quote the key.
  if (!/^[\x21-\x7e]+$/.test(value)) throw new Error(`${name} has characters a key cannot contain, such as a line break. Paste it again.`)
  return value
}

/** The Paystack and Terminal clients, built from the settings each time so a changed key takes effect. */
export function shopClients(): ShopClients {
  if (replacement) return replacement
  if (process.env.VITEST) throw new Error('A test reached the real shop clients. Install fakes with useFakeShopClients().')
  return {
    paystack: createPaystackClient(setting('PAYSTACK_SECRET_KEY')),
    terminal: createTerminalClient(setting('TERMINAL_SECRET_KEY'), process.env.TERMINAL_BASE_URL?.trim() || TERMINAL_SANDBOX),
  }
}
