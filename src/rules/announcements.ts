import type { Payload, Where } from 'payload'

/** Active while the current time is inside the announcement's dates. No end date means it runs on. */
export function activeAnnouncementsWhere(now: Date = new Date()): Where {
  const moment = now.toISOString()
  return {
    and: [
      { startsAt: { less_than_equal: moment } },
      { or: [{ endsAt: { exists: false } }, { endsAt: { greater_than: moment } }] },
    ],
  }
}

/** What the home page shows: up to 3 active announcements, newest first. */
export async function findActiveAnnouncements(payload: Payload, now: Date = new Date()) {
  const result = await payload.find({
    collection: 'announcements',
    where: activeAnnouncementsWhere(now),
    sort: '-startsAt',
    limit: 3,
    overrideAccess: false,
  })
  return result.docs
}
