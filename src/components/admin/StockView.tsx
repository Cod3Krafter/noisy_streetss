import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'

import { isShopUser } from '@/access'
import { stockRows } from '@/shop/stock'

import { StockList } from './StockList'

/** The admin's Stock page, for admins and shop staff. */
export async function StockView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult
  const allowed = isShopUser(req.user)
  const rows = allowed ? await stockRows(req) : []
  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <h1 style={{ margin: '24px 0 8px' }}>Stock</h1>
        {allowed ? (
          <>
            <p style={{ marginBottom: 24, maxWidth: 640 }}>
              Untick an item when the last copy goes. The change is live straight away, and any draft an editor is working on stays unpublished.
            </p>
            <StockList rows={rows} />
          </>
        ) : (
          <p>Only admins and shop staff can change stock.</p>
        )}
      </Gutter>
    </DefaultTemplate>
  )
}
