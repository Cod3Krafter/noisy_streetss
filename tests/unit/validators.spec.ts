import { describe, expect, it } from 'vitest'

import { formatsProblem } from '@/rules/books'
import { finalValue, isPublishing } from '@/rules/validation'
import { nairaValidator, urlValidator } from '@/rules/validators'

describe('nairaValidator', () => {
  const required = nairaValidator(true)
  const optional = nairaValidator(false)

  it('accepts whole naira and refuses kobo or negatives', () => {
    expect(required(12500)).toBe(true)
    expect(required(0)).toBe(true)
    expect(required(12500.5)).toMatch(/whole number/)
    expect(required(-1)).toMatch(/whole number/)
  })

  it('treats an empty value as missing only when required', () => {
    expect(required(undefined)).toMatch(/required/i)
    expect(required(null)).toMatch(/required/i)
    expect(optional(undefined)).toBe(true)
    expect(optional(null)).toBe(true)
  })
})

describe('urlValidator', () => {
  it('accepts web addresses and refuses anything else', () => {
    expect(urlValidator(true)('https://open.spotify.com/episode/1')).toBe(true)
    expect(urlValidator(true)('open.spotify.com')).toMatch(/https/)
    expect(urlValidator(false)('')).toBe(true)
    expect(urlValidator(true)('')).toMatch(/required/i)
  })

  it('accepts a scheme in any case', () => {
    expect(urlValidator(true)('HTTPS://example.com')).toBe(true)
  })

  it('treats a value of only spaces as empty when optional', () => {
    expect(urlValidator(false)('   ')).toBe(true)
  })

  it('treats a value of only spaces as missing when required', () => {
    expect(urlValidator(true)('   ')).toMatch(/required/i)
  })
})

describe('finalValue and isPublishing', () => {
  it('prefers the incoming value and falls back to the stored one', () => {
    expect(finalValue({ a: 1 }, { a: 2 }, 'a')).toBe(1)
    expect(finalValue({}, { a: 2 }, 'a')).toBe(2)
    expect(finalValue({ a: undefined }, { a: 2 }, 'a')).toBe(undefined)
  })

  it('treats only draft saves as not publishing', () => {
    expect(isPublishing({ _status: 'draft' }, undefined)).toBe(false)
    expect(isPublishing({ _status: 'published' }, { _status: 'draft' })).toBe(true)
    expect(isPublishing({}, { _status: 'published' })).toBe(true)
    expect(isPublishing({}, undefined)).toBe(true)
  })
})

describe('formatsProblem', () => {
  it('needs a format only when the book is for sale', () => {
    expect(formatsProblem(false, [])).toBeNull()
    expect(formatsProblem(true, [{ formatName: 'Paperback' }])).toBeNull()
    expect(formatsProblem(true, [])).toMatch(/at least one format/)
    expect(formatsProblem(true, undefined)).toMatch(/at least one format/)
  })
})
