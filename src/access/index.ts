import type { Access, FieldAccess } from 'payload'

export type StaffRole = 'admin' | 'editor'

type MaybeStaff = { role?: unknown; collection?: unknown } | null | undefined

/** True for an Admin or Editor account from the `users` collection. */
export function isStaffUser(user: unknown): boolean {
  const candidate = user as MaybeStaff
  if (!candidate) return false
  if (candidate.collection !== undefined && candidate.collection !== 'users') return false
  return candidate.role === 'admin' || candidate.role === 'editor'
}

export function isAdminUser(user: unknown): boolean {
  return isStaffUser(user) && (user as MaybeStaff)?.role === 'admin'
}

export const anyone: Access = () => true
export const nobody: Access = () => false
export const isStaff: Access = ({ req }) => isStaffUser(req.user)
export const isAdmin: Access = ({ req }) => isAdminUser(req.user)

/** Staff read everything, including drafts. Visitors only receive published records. */
export const publishedOrStaff: Access = ({ req }) =>
  isStaffUser(req.user) ? true : { _status: { equals: 'published' } }

/** Admins reach every staff account, editors only their own. */
export const adminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (isStaffUser(req.user) && req.user) return { id: { equals: req.user.id } }
  return false
}

export const isStaffField: FieldAccess = ({ req }) => isStaffUser(req.user)
export const isAdminField: FieldAccess = ({ req }) => isAdminUser(req.user)

/** For `admin.hidden`: hide from the admin menu unless the viewer is staff or an admin. */
export const staffOnlyInAdmin = ({ user }: { user: unknown }): boolean => !isStaffUser(user)
export const adminOnlyInAdmin = ({ user }: { user: unknown }): boolean => !isAdminUser(user)

/** Staff create, change and delete. Spread next to a read rule: `{ read: anyone, ...staffWrites }`. */
export const staffWrites = { create: isStaff, update: isStaff, delete: isStaff }
