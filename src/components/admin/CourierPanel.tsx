'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import type { CourierOptions } from '@/shop/booking'

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
const messageOf = (json: unknown) => (json as { errors?: { message?: string }[] } | null)?.errors?.[0]?.message

const box = { border: '1px solid var(--theme-elevation-150)', borderRadius: 4, padding: 16, marginBottom: 24 }
const warning = { background: 'var(--theme-warning-100)', padding: 8, borderRadius: 4, margin: '8px 0' }

/** The Book courier panel in an order's sidebar. */
export function CourierPanel() {
  const { id } = useDocumentInfo()
  const [data, setData] = useState<CourierOptions | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [attempt, setAttempt] = useState(0)

  // Opening the panel (and Try again) asks for today's prices. State is set only once the answer arrives.
  useEffect(() => {
    if (!id) return
    let stale = false
    void fetch(`/api/orders/${id}/courier-options`, { credentials: 'include' })
      .then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => null) }))
      .catch(() => ({ ok: false, json: null }))
      .then(({ ok, json }) => {
        if (stale) return
        if (!ok) {
          setError(messageOf(json) ?? 'The courier panel could not load.')
          return
        }
        const options = json as CourierOptions
        setError(null)
        setData(options)
        setChosen(options.options.find((option) => option.isCustomerChoice)?.rateId ?? null)
      })
    return () => {
      stale = true
    }
  }, [id, attempt])

  async function book() {
    if (!chosen) return
    setBusy(true)
    setError(null)
    const res = await fetch(`/api/orders/${id}/book-courier`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rateId: chosen }),
    })
    if (res.ok) {
      window.location.reload()
      return
    }
    setError(messageOf(await res.json().catch(() => null)) ?? 'The booking did not go through. Try again.')
    setBusy(false)
  }

  if (!id) return null
  const picked = data?.options.find((option) => option.rateId === chosen)
  const short = picked && data?.walletKobo !== null && data?.walletKobo !== undefined ? picked.priceKobo - data.walletKobo : 0

  return (
    <div style={box}>
      <h4 style={{ margin: '0 0 8px' }}>Courier</h4>
      {error ? <p role="alert" style={{ color: 'var(--theme-error-500)' }}>{error}</p> : null}
      {!data && !error ? <p>Loading courier prices.</p> : null}
      {data?.booked ? (
        <div>
          <p>Booked with {data.booked.carrierName ?? 'a courier'}.</p>
          {data.booked.trackingNumber ? <p>Tracking number: {data.booked.trackingNumber}</p> : null}
          {data.booked.trackingUrl ? <p><a href={data.booked.trackingUrl} target="_blank" rel="noreferrer">Track the parcel</a></p> : null}
          {data.booked.labelUrl ? <p><a href={data.booked.labelUrl} target="_blank" rel="noreferrer">Print the label</a></p> : null}
        </div>
      ) : null}
      {data && !data.booked && data.status !== 'paid' ? <p>Booking opens once the order is Paid.</p> : null}
      {data && data.status === 'paid' && !data.booked ? (
        <div>
          {data.staleClaim ? (
            <p style={warning}>A booking started more than 5 minutes ago never finished. Check Terminal&apos;s dashboard for this order before booking again.</p>
          ) : null}
          {data.missingPostcode ? <p style={warning}>Add the customer&apos;s postcode to the address and save. Couriers need it.</p> : null}
          {data.customerChoice ? (
            <p>Customer chose {data.customerChoice.carrierName} and paid {naira(data.paidDeliveryKobo)}.</p>
          ) : (
            <p>The customer paid the flat price of {naira(data.paidDeliveryKobo)}. Pick any courier.</p>
          )}
          {data.terminalError ? (
            <div>
              <p>{data.terminalError}</p>
              <Button buttonStyle="secondary" onClick={() => setAttempt((count) => count + 1)}>Try again</Button>
            </div>
          ) : null}
          {data.walletKobo !== null ? <p>Wallet: {naira(data.walletKobo)}</p> : null}
          {data.options.map((option) => {
            const difference = option.priceKobo - data.paidDeliveryKobo
            return (
              <label key={option.rateId} style={{ display: 'flex', gap: 8, alignItems: 'baseline', padding: '6px 0', flexWrap: 'wrap' }}>
                <input type="radio" name="courier" checked={chosen === option.rateId} onChange={() => setChosen(option.rateId)} />
                <span style={{ fontWeight: 600 }}>{option.carrierName}</span>
                <span>{naira(option.priceKobo)}</span>
                {option.estimate ? <span>{option.estimate}</span> : null}
                {option.isCustomerChoice && difference > 0 ? <span>+{naira(difference)} covered</span> : null}
              </label>
            )
          })}
          {short > 0 ? <p style={warning}>The wallet is {naira(short)} short. Top it up in Terminal&apos;s dashboard.</p> : null}
          {data.options.length > 0 ? (
            <Button buttonStyle="primary" disabled={!chosen || busy || short > 0 || data.missingPostcode} onClick={() => void book()}>
              {busy ? 'Booking' : 'Book courier'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
