/** A Nigerian number written as 0 and ten digits, or +234 and ten digits, stored as +234 and ten digits. */
export function normaliseNigerianPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const compact = value.replace(/[\s()-]/g, '')
  if (/^0[1-9]\d{9}$/.test(compact)) return `+234${compact.slice(1)}`
  if (/^\+234[1-9]\d{9}$/.test(compact)) return compact
  return null
}
