import { toKobo } from '@/shop/money'
import { stateLabel } from '@/shop/states'

export type FlatArea = { areaName: string; states: string[]; priceNGN: number }

/** The flat delivery price for a state: its area's price, or the everywhere-else price, or none. */
export function flatPriceFor(areas: FlatArea[], elsewherePriceNGN: number | null, state: string): { priceKobo: number; area: string } | null {
  const area = areas.find((candidate) => candidate.states.includes(state))
  if (area) return { priceKobo: toKobo(area.priceNGN), area: area.areaName }
  if (typeof elsewherePriceNGN === 'number') return { priceKobo: toKobo(elsewherePriceNGN), area: 'Everywhere else' }
  return null
}

type AreaRow = { areaName?: string | null; states?: string[] | null }

/** A message naming the first state listed in two areas, or null when each state is in one area at most. */
export function overlappingStatesProblem(rows: AreaRow[] | null | undefined): string | null {
  const seen = new Map<string, string>()
  for (const row of rows ?? []) {
    const name = row.areaName ?? ''
    for (const state of row.states ?? []) {
      const earlier = seen.get(state)
      if (earlier !== undefined) return `${stateLabel(state)} is in both "${earlier}" and "${name}". A state can only be in one area.`
      seen.set(state, name)
    }
  }
  return null
}
