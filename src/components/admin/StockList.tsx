'use client'

import { useMemo, useState } from 'react'

import type { StockRow } from '@/shop/stock'

type Group = { key: string; title: string; rows: StockRow[] }

const card = {
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: '12px 16px',
  marginBottom: 12,
  background: 'var(--theme-elevation-0)',
}

const chip = (inStock: boolean) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 10px',
  border: `1px solid ${inStock ? 'var(--theme-elevation-200)' : 'var(--theme-error-400)'}`,
  borderRadius: 4,
  cursor: 'pointer',
})

/** The Stock page's search box and switches. Each switch saves straight away. */
export function StockList({ rows: initial }: { rows: StockRow[] }) {
  const [rows, setRows] = useState(initial)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const groups = useMemo(() => {
    const wanted = query.trim().toLowerCase()
    const byItem = new Map<string, Group>()
    for (const row of rows) {
      if (wanted && !row.title.toLowerCase().includes(wanted)) continue
      const key = `${row.collection}:${row.id}`
      const group = byItem.get(key) ?? { key, title: row.title, rows: [] }
      group.rows.push(row)
      byItem.set(key, group)
    }
    return [...byItem.values()]
  }, [rows, query])

  async function toggle(row: StockRow) {
    setBusy(row.key)
    setError(null)
    const inStock = !row.inStock
    const res = await fetch('/api/shop/stock', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collection: row.collection, id: row.id, optionId: row.optionId, inStock }),
    })
    if (res.ok) {
      setRows((current) => current.map((candidate) => (candidate.key === row.key ? { ...candidate, inStock } : candidate)))
    } else {
      const json = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      setError(json?.errors?.[0]?.message ?? 'The change was not saved. Try again.')
    }
    setBusy(null)
  }

  return (
    <div>
      <input
        aria-label="Search by title"
        placeholder="Search by title"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        style={{ width: '100%', maxWidth: 480, padding: '8px 12px', marginBottom: 16, border: '1px solid var(--theme-elevation-150)', borderRadius: 4 }}
      />
      {error ? (
        <p role="alert" style={{ color: 'var(--theme-error-500)', marginBottom: 12 }}>
          {error}
        </p>
      ) : null}
      {groups.length === 0 ? <p>Nothing on sale matches that title.</p> : null}
      {groups.map((group) => (
        <div key={group.key} style={card}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{group.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {group.rows.map((row) => (
              <label key={row.key} style={chip(row.inStock)}>
                <input type="checkbox" checked={row.inStock} disabled={busy === row.key} onChange={() => void toggle(row)} />
                <span>{row.optionName ?? 'In stock'}</span>
                {row.inStock ? null : <span style={{ color: 'var(--theme-error-500)' }}>Sold out</span>}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
