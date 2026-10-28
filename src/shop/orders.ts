import type { PayloadRequest } from 'payload'

import type { Order } from '@/payload-types'
import { SHOP_SERVER } from '@/shop/context'

export async function findOrderByReference(req: PayloadRequest, reference: string): Promise<Order | null> {
  if (!reference) return null
  const { docs } = await req.payload.find({
    collection: 'orders',
    where: { 'payment.reference': { equals: reference } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
  })
  return docs[0] ?? null
}

export function findOrder(req: PayloadRequest, id: number | string): Promise<Order | null> {
  return req.payload.findByID({ collection: 'orders', id, depth: 0, overrideAccess: true, disableErrors: true, req })
}

/** A change the shop's own code makes: past access rules and the staff-only change rules. */
export function serverUpdate(req: PayloadRequest, id: number | string, data: Record<string, unknown>): Promise<Order> {
  return req.payload.update({
    collection: 'orders',
    id,
    data: data as never,
    overrideAccess: true,
    context: { [SHOP_SERVER]: true },
    depth: 0,
    req,
  })
}
