export const ORDER_STATUSES = [
  { label: 'Awaiting payment', value: 'awaiting-payment' },
  { label: 'Expired', value: 'expired' },
  { label: 'Paid', value: 'paid' },
  { label: 'Courier booked', value: 'courier-booked' },
  { label: 'In transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Returned', value: 'returned' },
  { label: 'Refunded', value: 'refunded' },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value']

export function statusLabel(status: string): string {
  return ORDER_STATUSES.find((candidate) => candidate.value === status)?.label ?? status
}

/** How far along its delivery an order is. Statuses outside delivery have no stage. */
const DELIVERY_STAGE: Partial<Record<string, number>> = {
  'courier-booked': 1,
  'in-transit': 2,
  delivered: 3,
  returned: 3,
}

/** Terminal's updates may only move an order further along its delivery, never back. */
export function isForwardMove(from: string, to: string): boolean {
  const before = DELIVERY_STAGE[from]
  const after = DELIVERY_STAGE[to]
  return before !== undefined && after !== undefined && after > before
}

/** The order number staff and customers see: the record id plus 1000. */
export function orderNumberFor(id: number): string {
  return `NS-${id + 1000}`
}
