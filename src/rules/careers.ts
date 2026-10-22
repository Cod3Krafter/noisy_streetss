import type { Where } from 'payload'

import { startOfLagosDay, toTime } from './time'

/** Shown while switched on and the closing day (Lagos time) hasn't ended. */
export function isCareerVisible(open: unknown, closingDate: unknown, now: Date = new Date()): boolean {
  if (open !== true) return false
  const closes = toTime(closingDate)
  return closes === null || closes >= startOfLagosDay(now).getTime()
}

export function visibleCareersWhere(now: Date = new Date()): Where {
  return {
    and: [
      { open: { equals: true } },
      {
        or: [
          { closingDate: { exists: false } },
          { closingDate: { greater_than_equal: startOfLagosDay(now).toISOString() } },
        ],
      },
    ],
  }
}
