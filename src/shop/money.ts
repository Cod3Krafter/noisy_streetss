/** Naira to kobo, as a whole number. Every sum in the shop is worked out in kobo. */
export function toKobo(naira: number): number {
  return Math.round(naira * 100)
}

/** Kobo to naira, for storing on an order. */
export function toNaira(kobo: number): number {
  return kobo / 100
}

/** "₦3,200", or "₦3,200.50" when there are kobo. */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100
  const whole = Number.isInteger(naira)
  return `₦${naira.toLocaleString('en-NG', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`
}
