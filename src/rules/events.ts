import type { Where } from 'payload'

import { toTime } from './time'

/** Upcoming while the end time, or the start time if there's no end, is in the future. */
export function isUpcomingEvent(startsAt: unknown, endsAt: unknown, now: Date = new Date()): boolean {
  const end = toTime(endsAt) ?? toTime(startsAt)
  return end !== null && end > now.getTime()
}

export function upcomingEventsWhere(now: Date = new Date()): Where {
  const moment = now.toISOString()
  return {
    or: [
      { endsAt: { greater_than: moment } },
      { and: [{ endsAt: { exists: false } }, { startsAt: { greater_than: moment } }] },
    ],
  }
}
