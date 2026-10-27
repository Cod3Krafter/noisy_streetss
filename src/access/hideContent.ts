import type { CollectionConfig, GlobalConfig } from 'payload'

import { isStaffUser } from '.'

type HiddenRule = NonNullable<NonNullable<CollectionConfig['admin']>['hidden']>

/** The lists and settings shop staff work with. Each already has its own menu rule. */
const SHOP_SIDE = new Set(['orders', 'users', 'shop-settings'])

/** Hidden from anyone who is not an admin or editor; for those, the list's own rule still applies. */
export function hiddenUnlessContentStaff(existing: HiddenRule | undefined): HiddenRule {
  return (args) => {
    if (!isStaffUser(args.user)) return true
    return typeof existing === 'function' ? existing(args) : Boolean(existing)
  }
}

/**
 * Payload shows a list in the admin menu and dashboard to anyone allowed to read it, and visitors
 * may read published content, so a Shop staff account would otherwise see every content list
 * (read-only). Everything except the shop side is hidden from it, applied once over the config in
 * the same way `guardDeletes` is.
 */
export function hideContentFromShopStaff<T extends CollectionConfig | GlobalConfig>(entities: T[]): T[] {
  return entities.map((entity) => {
    if (SHOP_SIDE.has(entity.slug)) return entity
    const admin = { ...entity.admin, hidden: hiddenUnlessContentStaff(entity.admin?.hidden as HiddenRule | undefined) }
    return { ...entity, admin } as T
  })
}
