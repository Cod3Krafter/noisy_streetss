import type { Where } from 'payload'

import { endsAfter, toTime } from './time'

export type CallStatus = 'upcoming' | 'open' | 'closed'

/** Upcoming before `opensAt`, open until `closesAt`, closed from then on. */
export function callStatus(opensAt: unknown, closesAt: unknown, now: Date = new Date()): CallStatus | null {
  const opens = toTime(opensAt)
  const closes = toTime(closesAt)
  if (opens === null || closes === null) return null
  const current = now.getTime()
  if (current < opens) return 'upcoming'
  if (current < closes) return 'open'
  return 'closed'
}

export const closesAfterOpens = endsAfter

/** Query for calls open right now. The `status` field is virtual, so it can't be queried. */
// Dates only. Visitor-facing code must also pass overrideAccess: false (or add _status: published) so drafts stay hidden.
export function openCallsWhere(now: Date = new Date()): Where {
  return {
    and: [
      { opensAt: { less_than_equal: now.toISOString() } },
      { closesAt: { greater_than: now.toISOString() } },
    ],
  }
}
