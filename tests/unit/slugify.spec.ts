import { describe, expect, it } from 'vitest'

import { slugField, slugify, validateSlug } from '@/fields/slug'

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

describe('validateSlug', () => {
  const ERROR = 'Use lower-case letters, numbers and single hyphens only.'
  const editing = { event: 'onChange' as const }
  const saving = { event: 'submit' as const }

  it('passes an empty Web address while editing, as the save fills it in', () => {
    expect(validateSlug(undefined, editing)).toBe(true)
    expect(validateSlug(null, editing)).toBe(true)
    expect(validateSlug('', editing)).toBe(true)
    expect(validateSlug('   ', editing)).toBe(true)
  })

  it('flags a malformed Web address while editing', () => {
    expect(validateSlug('Bad Slug!', editing)).toBe(ERROR)
    expect(validateSlug('double--hyphen', editing)).toBe(ERROR)
  })

  it('refuses an empty or malformed Web address on save, after the hook has had its turn', () => {
    expect(validateSlug(undefined, saving)).toBe(ERROR)
    expect(validateSlug('', saving)).toBe(ERROR)
    expect(validateSlug('   ', saving)).toBe(ERROR)
    expect(validateSlug('Bad Slug!', saving)).toBe(ERROR)
  })

  it('refuses an empty Web address when no event is given', () => {
    expect(validateSlug('', {})).toBe(ERROR)
  })

  it('passes a well-formed Web address', () => {
    expect(validateSlug('short-fiction-2', editing)).toBe(true)
    expect(validateSlug('short-fiction-2', saving)).toBe(true)
  })
})

describe('slugField', () => {
  it('explains the automatic number in its hint', () => {
    const field = slugField('title') as { admin: { description: string } }
    expect(field.admin.description).toBe(
      'Made from the title when left empty, adding -2 (or the next free number) if that address is already used. An address you type yourself must be unused and use only lower-case letters, numbers and single hyphens.',
    )
  })
})
