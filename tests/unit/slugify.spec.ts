import { describe, expect, it } from 'vitest'

import { slugify } from '@/fields/slug'

describe('slugify', () => {
  it('lower-cases and hyphenates', () => {
    expect(slugify('The Cartographer of Sandbars')).toBe('the-cartographer-of-sandbars')
  })

  it('keeps the base letter of accented and Yoruba letters', () => {
    expect(slugify('Adéọlá Ọ̀ṣun')).toBe('adeola-osun')
  })

  it('maps letters that have no accent to strip', () => {
    expect(slugify('Ɗanjuma Ƙofar Ɓaure')).toBe('danjuma-kofar-baure')
    expect(slugify('Søren Łódź Straße')).toBe('soren-lodz-strasse')
  })

  it('spells out ampersands and drops apostrophes', () => {
    expect(slugify('Writers & Readers')).toBe('writers-and-readers')
    expect(slugify("Don't Stop")).toBe('dont-stop')
    expect(slugify('Don’t Stop')).toBe('dont-stop')
  })

  it('trims stray hyphens and spaces', () => {
    expect(slugify('  --Hello,   World!--  ')).toBe('hello-world')
  })

  it('caps the length at 80 without a trailing hyphen', () => {
    const slug = slugify('word '.repeat(40))
    expect(slug.length).toBeLessThanOrEqual(80)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('returns an empty string when nothing usable is left', () => {
    expect(slugify('!!!')).toBe('')
  })
})
