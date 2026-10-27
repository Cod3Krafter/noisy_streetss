import { sql } from '@payloadcms/db-postgres'
import type { PayloadRequest } from 'payload'

import type { OrderStatus } from '@/shop/statuses'

type Database = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }

const database = (req: PayloadRequest) => (req.payload.db as unknown as { drizzle: Database }).drizzle

/** A booking that never finished (a crash or a timeout) stops holding its order after this long. */
export const BOOKING_CLAIM_LAPSES_MS = 5 * 60_000

/**
 * Moves an order from one of `from` to `to` in a single statement, and says whether this call did it.
 * Payload's own update with a `where` finds the records first and then changes them, which two
 * callers arriving together could both pass. The statuses come from this code, never from a request.
 */
export async function claimStatus(req: PayloadRequest, id: number, from: readonly OrderStatus[], to: OrderStatus): Promise<boolean> {
  const allowed = sql.join(
    from.map((status) => sql`${status}::enum_orders_status`),
    sql`, `,
  )
  const result = await database(req).execute(sql`
    update "orders" set "status" = ${to}::enum_orders_status, "updated_at" = now()
    where "id" = ${id} and "status" in (${allowed})
    returning "id"`)
  return result.rows.length > 0
}

/** Holds a Paid order for one booking at a time. A hold older than five minutes has lapsed. */
export async function claimBooking(req: PayloadRequest, id: number): Promise<boolean> {
  const lapsed = new Date(Date.now() - BOOKING_CLAIM_LAPSES_MS).toISOString()
  const result = await database(req).execute(sql`
    update "orders" set "shipment_booking_started_at" = now()
    where "id" = ${id} and "status" = 'paid'
      and ("shipment_booking_started_at" is null or "shipment_booking_started_at" < ${lapsed}::timestamptz)
    returning "id"`)
  return result.rows.length > 0
}

export async function releaseBooking(req: PayloadRequest, id: number): Promise<void> {
  await database(req).execute(sql`update "orders" set "shipment_booking_started_at" = null where "id" = ${id}`)
}
