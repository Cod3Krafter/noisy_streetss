import { describe, expect, it } from 'vitest'

import { inUseMessage, richTextRefs, wordsFromName } from '@/rules/references'

describe('wordsFromName', () => {
  it('turns a field name into a label', () => {
    expect(wordsFromName('heroImage')).toBe('Hero image')
    expect(wordsFromName('cover')).toBe('Cover')
    expect(wordsFromName('site-settings')).toBe('Site settings')
  })
})

describe('richTextRefs', () => {
  const paragraph = (...children: unknown[]) => ({ type: 'paragraph', children })

  it('finds placed images, relationship blocks and internal links, at any depth', () => {
    const value = {
      root: {
        type: 'root',
        children: [
          { type: 'upload', relationTo: 'media', value: 7 },
          { type: 'relationship', relationTo: 'books', value: { id: 3, title: 'Populated' } },
          paragraph({ type: 'link', fields: { linkType: 'internal', doc: { relationTo: 'writers', value: 9 } }, children: [] }),
          paragraph({ type: 'link', fields: { linkType: 'custom', url: 'https://example.com' }, children: [] }),
        ],
      },
    }
    expect(richTextRefs(value)).toEqual([
      { relationTo: 'media', id: '7' },
      { relationTo: 'books', id: '3' },
      { relationTo: 'writers', id: '9' },
    ])
  })

  it('returns nothing for empty or unexpected values', () => {
    expect(richTextRefs(null)).toEqual([])
    expect(richTextRefs({})).toEqual([])
    expect(richTextRefs({ root: { children: 'not a list' } })).toEqual([])
  })
})

describe('inUseMessage', () => {
  it('names each place once, with every field it is used in', () => {
    const message = inUseMessage('"Harmattan"', [
      { holder: 'Article "One"', field: 'Cover', record: { collection: 'articles', id: 1 } },
      { holder: 'Article "One"', field: 'Body', record: { collection: 'articles', id: 1 } },
      { holder: 'Article "One"', field: 'Body', record: { collection: 'articles', id: 1 } },
      { holder: 'Site settings', field: 'Default sharing image' },
    ])
    expect(message).toBe(
      '"Harmattan" is still used by Article "One" (Cover, Body); Site settings (Default sharing image). Remove it from there first, then delete it.',
    )
  })

  it('keeps two records with the same title apart', () => {
    const message = inUseMessage('"Photo"', [
      { holder: 'Book "Same"', field: 'Cover', record: { collection: 'books', id: 1 } },
      { holder: 'Book "Same"', field: 'Cover', record: { collection: 'books', id: 2 } },
    ])
    expect(message).toContain('Book "Same" (Cover); Book "Same" (Cover).')
  })

  it('lists five places and counts the rest', () => {
    const usages = Array.from({ length: 7 }, (_, i) => ({
      holder: `Book "B${i}"`,
      field: 'Cover',
      record: { collection: 'books', id: i },
    }))
    const message = inUseMessage('"Photo"', usages)
    expect(message).toContain('Book "B4" (Cover); and 2 more. Remove it from there first')
    expect(message).not.toContain('B5')
  })
})
