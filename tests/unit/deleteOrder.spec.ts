import { describe, expect, it } from 'vitest'

import { deleteOrder } from '@/seed/deleteOrder'

const field = (relationTo: string, type = 'relationship') => ({ type, relationTo })
const collection = (slug: string, ...fields: object[]) => ({ slug, flattenedFields: fields })

// Listed in the admin menu order, not dependency order: pointing collections can come first or last.
const collections = [
  collection('books'),
  collection('submission-calls'),
  collection('popup-campaigns', field('books')),
  collection('manuscripts'),
  collection('manuscript-submissions', field('submission-calls'), field('manuscripts', 'upload')),
  collection('articles', { type: 'group', flattenedFields: [field('books')] }),
  collection('media'),
]

describe('deleteOrder', () => {
  const everything = collections.map((entry) => entry.slug)
  const order = deleteOrder(collections, everything)

  it('puts popups before books, and submissions before calls and manuscripts', () => {
    expect(order.indexOf('popup-campaigns')).toBeLessThan(order.indexOf('books'))
    expect(order.indexOf('manuscript-submissions')).toBeLessThan(order.indexOf('submission-calls'))
    expect(order.indexOf('manuscript-submissions')).toBeLessThan(order.indexOf('manuscripts'))
    expect(order.indexOf('articles')).toBeLessThan(order.indexOf('books'))
    expect(order).toHaveLength(everything.length)
  })

  it('adds what points at the given collections, and nothing else', () => {
    expect(deleteOrder(collections, ['books'])).toEqual(expect.arrayContaining(['books', 'popup-campaigns', 'articles']))
    expect(deleteOrder(collections, ['books'])).not.toContain('media')
    expect(deleteOrder(collections, ['submission-calls'])).toEqual(['manuscript-submissions', 'submission-calls'])
  })

  it('refuses an unknown collection', () => {
    expect(() => deleteOrder(collections, ['nope'])).toThrow(/unknown collection/)
  })
})
