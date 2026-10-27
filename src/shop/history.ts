export type HistoryRow = {
  id?: string | null
  at: string
  from?: string | null
  to?: string | null
  by: string
  note?: string | null
}

type NewEntry = { from?: string | null; to?: string | null; by: string; note?: string | null; at?: string }

/** The history with one entry added at the end. Existing rows keep their ids, so Payload keeps them. */
export function appendHistory(existing: HistoryRow[] | null | undefined, entry: NewEntry): HistoryRow[] {
  return [
    ...(existing ?? []),
    { at: entry.at ?? new Date().toISOString(), from: entry.from ?? null, to: entry.to ?? null, by: entry.by, note: entry.note ?? null },
  ]
}

const sameTime = (a: string, b: string) => new Date(a).getTime() === new Date(b).getTime()

function sameEntry(a: HistoryRow, b: HistoryRow | undefined): boolean {
  return (
    b !== undefined &&
    sameTime(a.at, b.at) &&
    (a.from ?? null) === (b.from ?? null) &&
    (a.to ?? null) === (b.to ?? null) &&
    a.by === b.by &&
    (a.note ?? null) === (b.note ?? null)
  )
}

/** True when `after` starts with every entry of `before`, unchanged: the history only grew. */
export function keepsHistory(before: HistoryRow[] | null | undefined, after: HistoryRow[] | null | undefined): boolean {
  const old = before ?? []
  const next = after ?? []
  return next.length >= old.length && old.every((entry, index) => sameEntry(entry, next[index]))
}
