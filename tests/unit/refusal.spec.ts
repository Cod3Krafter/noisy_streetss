import { APIError } from 'payload'
import { describe, expect, it } from 'vitest'

import { Refusal, REFUSAL } from '@/refusal'

describe('Refusal', () => {
  it('is an APIError named Refusal, so Payload logs it by that name', () => {
    const refusal = new Refusal('Not allowed.')
    expect(refusal).toBeInstanceOf(APIError)
    expect(refusal.name).toBe('Refusal')
    expect(REFUSAL).toBe('Refusal')
  })

  it('answers 400 unless given another status, and shows its message to the person', () => {
    expect(new Refusal('No.').status).toBe(400)
    expect(new Refusal('Too big.', 413).status).toBe(413)
    const refusal = new Refusal('No.')
    expect(refusal.isPublic).toBe(true)
    expect(refusal.message).toBe('No.')
  })
})
