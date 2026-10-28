// Registers this site's webhook address with Terminal Africa. Run once per environment, for example:
//   node --env-file=.env scripts/register-terminal-webhook.mjs https://<site>/api/terminal/webhook
// The key is read from TERMINAL_SECRET_KEY and never printed. TERMINAL_BASE_URL picks the
// environment (the sandbox by default); any other address is registered as a live webhook.
const [url] = process.argv.slice(2)
const key = process.env.TERMINAL_SECRET_KEY
const base = process.env.TERMINAL_BASE_URL || 'https://sandbox.terminal.africa/v1'

if (!url || !/^https:\/\/\S+\/api\/terminal\/webhook$/.test(url)) {
  console.error('Give the full https address of /api/terminal/webhook.')
  process.exit(1)
}
if (!key) {
  console.error('TERMINAL_SECRET_KEY is not set.')
  process.exit(1)
}

// The body Terminal documents for POST /webhooks: name, active, events, live and url, all required.
const events = [
  'pickup.completed',
  'pickup.failed',
  'pickup.cancelled',
  'shipment.in-transit',
  'shipment.delivered',
  'shipment.returned',
  'shipment.cancelled',
  'transaction.failed',
  'reconciliation.flagged',
]

const res = await fetch(`${base}/webhooks`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Noisy Streetss shop', active: true, events, live: !base.includes('sandbox'), url }),
})
const json = await res.json().catch(() => null)
console.log(`${res.status} ${json?.message ?? ''}`)
if (!res.ok) process.exit(1)
