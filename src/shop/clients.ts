import { createPaystackClient, type PaystackClient } from '@/shop/paystack'
import { createTerminalClient, TERMINAL_SANDBOX, type TerminalClient } from '@/shop/terminal'

export type ShopClients = { paystack: PaystackClient; terminal: TerminalClient }

let replacement: ShopClients | null = null

/** For tests only: every shop call then goes to these fakes. Pass null to go back to the real services. */
export function setShopClients(clients: ShopClients | null): void {
  replacement = clients
}

/**
 * True when a key, already trimmed, holds only printable characters with no spaces. A line break or
 * space inside a key breaks the Authorization header, and the resulting error would quote the key.
 */
export const isPrintableKey = (value: string) => /^[\x21-\x7e]+$/.test(value)

type KeyName = 'PAYSTACK_SECRET_KEY' | 'TERMINAL_SECRET_KEY'

/** The key, trimmed, or what is wrong with it. The problem names the setting, never its value. */
function readKey(name: KeyName): { key: string; problem: null } | { key: null; problem: string } {
  const value = process.env[name]?.trim()
  if (!value) return { key: null, problem: `${name} is not set.` }
  if (!isPrintableKey(value)) return { key: null, problem: `${name} has characters a key cannot contain, such as a line break. Paste it again.` }
  return { key: value, problem: null }
}

function setting(name: KeyName): string {
  const { key, problem } = readKey(name)
  if (problem !== null) throw new Error(problem)
  return key
}

/**
 * The key a webhook's signature is checked with, read by the same rule as the clients' keys. It
 * never throws: a missing or unusable key is logged at error level (by its name, never its value)
 * and gives null, which the webhook answers as a signature that does not match.
 */
export function webhookKey(name: KeyName, logger: { error: (message: string) => void }): string | null {
  const { key, problem } = readKey(name)
  if (problem !== null) logger.error(`${problem} Webhooks cannot be checked until it is fixed.`)
  return key
}

/**
 * The Paystack and Terminal clients, built from the settings each time so a changed key takes
 * effect. Each is built only when used, so a missing Paystack key breaks nothing in Terminal's
 * features, and the other way round.
 */
export function shopClients(): ShopClients {
  if (replacement) return replacement
  if (process.env.VITEST) throw new Error('A test reached the real shop clients. Install fakes with useFakeShopClients().')
  return {
    get paystack() {
      return createPaystackClient(setting('PAYSTACK_SECRET_KEY'))
    },
    get terminal() {
      return createTerminalClient(setting('TERMINAL_SECRET_KEY'), process.env.TERMINAL_BASE_URL?.trim() || TERMINAL_SANDBOX)
    },
  }
}
