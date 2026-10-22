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

/**
 * Field `validate` for an end date: must be a real date, later than the sibling `startField`.
 * Empty passes unless `required`. Used for closing and end dates across the collections.
 */
export const endsAfterField =
  (startField: string, message: string, required = false) =>
  (value: unknown, { siblingData }: { siblingData: unknown }): true | string => {
    if (value === null || value === undefined || value === '') return required ? 'This field is required.' : true
    if (toTime(value) === null) return 'Enter a valid date and time.'
    const start = (siblingData as Record<string, unknown> | undefined)?.[startField]
    return endsAfter(start, value) ? true : message
  }
