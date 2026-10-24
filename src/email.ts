import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

type TransportOptions = NonNullable<NonNullable<Parameters<typeof nodemailerAdapter>[0]>['transportOptions']>

const DEFAULT_NAME = 'Noisy Streetss'

/** "Noisy Streetss <website@example.com>" becomes { name, address }. */
export function parseFrom(value: string): { name: string; address: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (match) return { name: match[1] || DEFAULT_NAME, address: match[2].trim() }
  return { name: DEFAULT_NAME, address: value.trim() }
}

/**
 * How to reach the SMTP server. In production the connection must be encrypted: on port 465 it is
 * from the start, anywhere else `requireTLS` makes Nodemailer refuse to send (or log in) unless
 * the server upgrades to TLS, so an attacker cannot strip the offer and read the login (a Resend
 * API key). Locally Mailpit offers no encryption, so this stays off there. Every timeout is 10
 * seconds, the socket one included: its default is 10 minutes, and a server that greets and then
 * stalls would hold up a cold start, because production checks the connection at start-up.
 */
export function transportOptions(env: Record<string, string | undefined>): TransportOptions {
  const port = Number(env.SMTP_PORT || 587)
  const secure = port === 465
  return {
    host: env.SMTP_HOST,
    port,
    secure,
    ...(env.NODE_ENV === 'production' && !secure ? { requireTLS: true } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  }
}

/**
 * Sends through any SMTP server: Mailpit locally, Resend or the client's existing
 * service in production. Without SMTP_HOST, Payload only logs emails (as in the tests).
 */
export function emailAdapter() {
  if (!process.env.SMTP_HOST) return undefined
  const from = parseFrom(process.env.SMTP_FROM || `${DEFAULT_NAME} <website@noisystreetss.test>`)
  return nodemailerAdapter({
    defaultFromAddress: from.address,
    defaultFromName: from.name,
    // The connection is checked whenever the server starts in production, so a wrong host shows in
    // the logs at once.
    skipVerify: process.env.NODE_ENV !== 'production',
    transportOptions: transportOptions(process.env),
  })
}
