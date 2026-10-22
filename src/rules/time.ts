/** Milliseconds since 1970 for a date string or Date, or null when missing or invalid. */
export function toTime(value: unknown): number | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

/** True when `end` is later than `start`, or when either is still empty. */
export function endsAfter(start: unknown, end: unknown): boolean {
  const from = toTime(start)
  const to = toTime(end)
  if (from === null || to === null) return true
  return to > from
}
