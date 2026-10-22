import type { Where } from 'payload'

import { toTime } from './time'

/** True when two ranges share any moment. Ranges that only touch end to start don't overlap. */
export function datesOverlap(aStart: unknown, aEnd: unknown, bStart: unknown, bEnd: unknown): boolean {
  const [as, ae, bs, be] = [toTime(aStart), toTime(aEnd), toTime(bStart), toTime(bEnd)]
  if (as === null || ae === null || bs === null || be === null) return false
  return as < be && bs < ae
}

/** Enabled campaigns whose dates overlap the given range, other than the campaign itself. */
export function overlappingCampaignsWhere(startsAt: string, endsAt: string, ownId?: number | string): Where {
  return {
    and: [
      { enabled: { equals: true } },
      { startsAt: { less_than: endsAt } },
      { endsAt: { greater_than: startsAt } },
      ...(ownId ? [{ id: { not_equals: ownId } }] : []),
    ],
  }
}
