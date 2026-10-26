import type { SanitizedConfig } from 'payload'

import { isStaff } from '.'

/**
 * Payload keeps who is editing what in a hidden `payload-locked-documents` collection, and job
 * statistics in a `payload-jobs-stats` global. Both ship with Payload's default access, which lets
 * any logged-in account read and write them. Once members can log in, that would let a member list
 * what staff are editing (draft ids included), forge a lock under an admin's name, or delete real ones.
 *
 * Payload offers no option to set this, and it adds both while sanitising the config, so it is done
 * here on the finished config (the same way `withScheduledPublishAlerts` wraps the publish task).
 * The admin's own locking is unaffected: it only ever runs as a staff account.
 */
export function withStaffOnlyInternals(config: SanitizedConfig): SanitizedConfig {
  const locks = config.collections.find((collection) => collection.slug === 'payload-locked-documents')
  if (locks) {
    locks.access = { ...locks.access, read: isStaff, create: isStaff, update: isStaff, delete: isStaff }
  }
  const stats = config.globals.find((global) => (global.slug as string) === 'payload-jobs-stats')
  if (stats) {
    stats.access = { ...stats.access, read: isStaff, update: isStaff }
  }
  return config
}
