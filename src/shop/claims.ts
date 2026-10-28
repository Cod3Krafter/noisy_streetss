import { sql } from '@payloadcms/db-postgres'
import { commitTransaction, initTransaction, killTransaction, type PayloadRequest } from 'payload'

type Database = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }
type Adapter = { drizzle: Database; sessions: Record<string, { db: Database } | undefined> }

const adapterOf = (req: PayloadRequest) => req.payload.db as unknown as Adapter

const database = (req: PayloadRequest) => adapterOf(req).drizzle

/**
 * The connection for the request's open transaction. Payload's Postgres adapter keeps each open
 * transaction in `db.sessions`, keyed by the id on `req.transactionID` (a promise while it starts).
 */
async function transactionDatabase(req: PayloadRequest): Promise<Database> {
  const id = req.transactionID instanceof Promise ? await req.transactionID : req.transactionID
  if (!id) return database(req)
  const session = adapterOf(req).sessions[String(id)]
  if (!session) throw new Error(`The transaction for this request (${id}) has already ended, so the order cannot be locked.`)
  return session.db
}

/** The tables a row lock can be taken on. A fixed list, so the table name never comes from input. */
const lockable = { orders: sql.identifier('orders'), books: sql.identifier('books'), merch: sql.identifier('merch') } as const

/**
 * Runs `work` while holding one row of `table`, inside a transaction. A second caller waits on the
 * row lock and then reads the state the first one committed, so a check followed by a write
 * cannot be overtaken. A failure rolls back everything the work wrote, so a retry can finish it.
 * Every Payload call in `work` must pass this same `req`, so it runs in the same transaction, and
 * callers running at the same moment each need a req of their own: one req carries one transaction.
 * If `req` is already in a transaction, the lock joins it and is held until that one ends.
 */
export async function withRowLock<T>(req: PayloadRequest, table: keyof typeof lockable, id: number, work: () => Promise<T>): Promise<T> {
  const shouldCommit = await initTransaction(req)
  try {
    const db = await transactionDatabase(req)
    await db.execute(sql`select "id" from ${lockable[table]} where "id" = ${id} for update`)
    const result = await work()
    if (shouldCommit) await commitTransaction(req)
    return result
  } catch (error) {
    await killTransaction(req)
    throw error
  }
}

/** Runs `work` while holding the order's row. See withRowLock. */
export const withOrderLock = <T>(req: PayloadRequest, orderId: number, work: () => Promise<T>): Promise<T> => withRowLock(req, 'orders', orderId, work)

/** A booking that never finished (a crash or a timeout) stops holding its order after this long. */
export const BOOKING_CLAIM_LAPSES_MS = 5 * 60_000

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
