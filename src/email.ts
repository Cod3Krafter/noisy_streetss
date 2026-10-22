import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

const DEFAULT_NAME = 'Noisy Streetss'

/** "Noisy Streetss <website@example.com>" becomes { name, address }. */
export function parseFrom(value: string): { name: string; address: string } {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)
  if (match) return { name: match[1] || DEFAULT_NAME, address: match[2].trim() }
  return { name: DEFAULT_NAME, address: value.trim() }
}

/**
 * Sends through any SMTP server: Mailpit locally, Resend or the client's existing
 * service in production. Without SMTP_HOST, Payload only logs emails (as in the tests).
 */
export function emailAdapter() {
  const host = process.env.SMTP_HOST
  if (!host) return undefined
  const port = Number(process.env.SMTP_PORT || 587)
  const from = parseFrom(process.env.SMTP_FROM || `${DEFAULT_NAME} <website@noisystreetss.test>`)
  return nodemailerAdapter({
    defaultFromAddress: from.address,
    defaultFromName: from.name,
    skipVerify: true,
    transportOptions: {
      host,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    },
  })
}
