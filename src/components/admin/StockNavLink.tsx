import Link from 'next/link'
import type { ServerProps } from 'payload'

import { isShopUser } from '@/access'

/** The Stock page's link in the admin menu, for admins and shop staff only. */
export function StockNavLink({ user }: ServerProps) {
  if (!isShopUser(user)) return null
  return (
    <Link className="nav__link" href="/admin/stock" prefetch={false}>
      <span className="nav__link-label">Stock</span>
    </Link>
  )
}
