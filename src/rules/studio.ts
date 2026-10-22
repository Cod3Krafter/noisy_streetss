const isRate = (value: unknown) => typeof value === 'number' && value >= 0

/** A studio service needs a price. Returns the message to show, or null when fine. */
export function ratesProblem(hourly: unknown, halfDay: unknown, fullDay: unknown): string | null {
  return isRate(hourly) || isRate(halfDay) || isRate(fullDay)
    ? null
    : 'Add at least one rate (hourly, half day or full day) before publishing.'
}
