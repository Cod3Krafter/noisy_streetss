import type { Order } from '@/payload-types'

/** Nigeria's 36 states and the Federal Capital Territory. The values are stored on orders and settings. */
export const NIGERIAN_STATES = [
  { label: 'Abia', value: 'abia' },
  { label: 'Adamawa', value: 'adamawa' },
  { label: 'Akwa Ibom', value: 'akwa-ibom' },
  { label: 'Anambra', value: 'anambra' },
  { label: 'Bauchi', value: 'bauchi' },
  { label: 'Bayelsa', value: 'bayelsa' },
  { label: 'Benue', value: 'benue' },
  { label: 'Borno', value: 'borno' },
  { label: 'Cross River', value: 'cross-river' },
  { label: 'Delta', value: 'delta' },
  { label: 'Ebonyi', value: 'ebonyi' },
  { label: 'Edo', value: 'edo' },
  { label: 'Ekiti', value: 'ekiti' },
  { label: 'Enugu', value: 'enugu' },
  { label: 'Federal Capital Territory', value: 'fct' },
  { label: 'Gombe', value: 'gombe' },
  { label: 'Imo', value: 'imo' },
  { label: 'Jigawa', value: 'jigawa' },
  { label: 'Kaduna', value: 'kaduna' },
  { label: 'Kano', value: 'kano' },
  { label: 'Katsina', value: 'katsina' },
  { label: 'Kebbi', value: 'kebbi' },
  { label: 'Kogi', value: 'kogi' },
  { label: 'Kwara', value: 'kwara' },
  { label: 'Lagos', value: 'lagos' },
  { label: 'Nasarawa', value: 'nasarawa' },
  { label: 'Niger', value: 'niger' },
  { label: 'Ogun', value: 'ogun' },
  { label: 'Ondo', value: 'ondo' },
  { label: 'Osun', value: 'osun' },
  { label: 'Oyo', value: 'oyo' },
  { label: 'Plateau', value: 'plateau' },
  { label: 'Rivers', value: 'rivers' },
  { label: 'Sokoto', value: 'sokoto' },
  { label: 'Taraba', value: 'taraba' },
  { label: 'Yobe', value: 'yobe' },
  { label: 'Zamfara', value: 'zamfara' },
]

const LABELS = new Map(NIGERIAN_STATES.map((state) => [state.value, state.label]))

export type NigerianState = NonNullable<NonNullable<Order['address']>['state']>

export function isNigerianState(value: unknown): value is NigerianState {
  return typeof value === 'string' && LABELS.has(value)
}

export function stateLabel(value: string): string {
  return LABELS.get(value) ?? value
}

/**
 * The state name sent to Terminal. Pending check P4: Terminal's expected names are not documented,
 * so the plain label is assumed ("Lagos", "Federal Capital Territory"). Task 16 corrects this map.
 */
export function terminalStateName(value: string): string {
  return stateLabel(value)
}

/** A Nigerian postcode: six digits. Checkout and the order screen both allow it to be left empty. */
export const isNigerianPostcode = (value: string) => /^\d{6}$/.test(value)

export const NIGERIAN_POSTCODE_PROBLEM = 'A Nigerian postcode has six digits. Leave it empty if you are not sure.'
