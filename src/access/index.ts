import type { Access, FieldAccess } from 'payload'

export type StaffRole = 'admin' | 'editor' | 'shop'

type MaybeStaff = { role?: unknown; collection?: unknown } | null | undefined

/** The role of an account from the `users` collection, or undefined for anyone else. */
function roleOf(user: unknown): unknown {
  const candidate = user as MaybeStaff
  if (!candidate) return undefined
  if (candidate.collection !== undefined && candidate.collection !== 'users') return undefined
  return candidate.role
}

/** True for an Admin or Editor account: the people who work on content. Shop staff are not included. */
export function isStaffUser(user: unknown): boolean {
  const role = roleOf(user)
  return role === 'admin' || role === 'editor'
}

/** True for an Admin or Shop staff account: the people who work on orders and stock. */
export function isShopUser(user: unknown): boolean {
  const role = roleOf(user)
  return role === 'admin' || role === 'shop'
}

/** True for any staff account, whatever its role. Used for opening /admin, one's own account and edit locks. */
export function isAnyStaffUser(user: unknown): boolean {
  return isStaffUser(user) || isShopUser(user)
}

export function isAdminUser(user: unknown): boolean {
  return roleOf(user) === 'admin'
}

export const anyone: Access = () => true
export const nobody: Access = () => false
export const isStaff: Access = ({ req }) => isStaffUser(req.user)
export const isAdmin: Access = ({ req }) => isAdminUser(req.user)
export const isShop: Access = ({ req }) => isShopUser(req.user)
export const isAnyStaff: Access = ({ req }) => isAnyStaffUser(req.user)

/** Staff read everything, including drafts. Visitors only receive published records. */
export const publishedOrStaff: Access = ({ req }) =>
  isStaffUser(req.user) ? true : { _status: { equals: 'published' } }

/** Admins reach every staff account; editors and shop staff only their own. */
export const adminOrSelf: Access = ({ req }) => {
  if (isAdminUser(req.user)) return true
  if (isAnyStaffUser(req.user) && req.user) return { id: { equals: req.user.id } }
  return false
}

export const isStaffField: FieldAccess = ({ req }) => isStaffUser(req.user)
export const isAdminField: FieldAccess = ({ req }) => isAdminUser(req.user)

/** For `admin.hidden`: hide from the admin menu unless the viewer is staff or an admin. */
export const staffOnlyInAdmin = ({ user }: { user: unknown }): boolean => !isStaffUser(user)
export const adminOnlyInAdmin = ({ user }: { user: unknown }): boolean => !isAdminUser(user)
export const shopOnlyInAdmin = ({ user }: { user: unknown }): boolean => !isShopUser(user)

/** Staff create, change and delete. Spread next to a read rule: `{ read: anyone, ...staffWrites }`. */
export const staffWrites = { create: isStaff, update: isStaff, delete: isStaff }

/**
 * For collections with drafts. Visitors read published records only; staff read everything.
 * Payload lets any logged-in account read version history unless told otherwise, and that
 * history holds every draft, so it is staff-only here (members will be logged in too).
 */
export const publishedOrStaffAccess = { read: publishedOrStaff, readVersions: isStaff, ...staffWrites }
