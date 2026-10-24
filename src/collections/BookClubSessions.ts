import type { CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaffAccess } from '@/access'
import { bookOrTitleProblem } from '@/rules/bookClub'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { urlValidator } from '@/rules/validators'

const requireBookOrTitle: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = bookOrTitleProblem(finalValue(data, originalDoc, 'book'), finalValue(data, originalDoc, 'title'))
  if (problem) rejectField(req, 'book-club-sessions', 'title', problem)
  return data
}

type BookValue = number | string | { id: number | string } | null | undefined

const bookId = (book: BookValue) => (typeof book === 'object' && book !== null ? book.id : book) || undefined

/**
 * A session with a book takes the book's title, so it never shows as untitled, and keeps following
 * the book while the title is still the one copied from it: when the book changes and the stored
 * title equals the previous book's title (it was never edited), the new book's title is copied.
 * A typed title is kept. An empty or spaces-only title takes the book's title, the same trimmed
 * check as bookOrTitleProblem. A later rename of the book itself is not picked up: once the book
 * is renamed, the stored title no longer equals its title, so it counts as typed and stays, even
 * when the book is changed. Clearing the title takes the current book's title.
 */
const titleFromBook: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const id = bookId(finalValue<BookValue>(data, originalDoc, 'book'))
  if (!id) return data

  const title = finalValue<string | null>(data, originalDoc, 'title')
  const typed = typeof title === 'string' ? title.trim() : ''
  const previousId = bookId(originalDoc?.book as BookValue)

  if (typed) {
    // Not the first book, or the book has not changed: a typed title stays as it is.
    if (!previousId || previousId === id) return data
    const previous = await req.payload
      .findByID({ collection: 'books', id: previousId, depth: 0, req, overrideAccess: true })
      .catch(() => null)
    if (!previous || (previous.title ?? '').trim() !== typed) return data
  }

  const found = await req.payload.findByID({ collection: 'books', id, depth: 0, req, overrideAccess: true })
  return { ...data, title: found.title }
}

export const BookClubSessions: CollectionConfig = {
  slug: 'book-club-sessions',
  labels: { singular: 'Book Club session', plural: 'Book Club sessions' },
  admin: {
    group: "What's on",
    useAsTitle: 'title',
    defaultColumns: ['title', 'book', 'startsAt', 'registrationOpen', '_status'],
  },
  access: publishedOrStaffAccess,
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: { beforeValidate: [requireBookOrTitle], beforeChange: [titleFromBook] },
  fields: [
    { name: 'book', type: 'relationship', relationTo: 'books', admin: { description: 'The book being read, if there is one.' } },
    { name: 'title', type: 'text', admin: { description: "Needed when no book is chosen. Left empty, the book's title is used." } },
    { name: 'startsAt', label: 'Starts', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'venue', type: 'text' },
    { name: 'onlineUrl', label: 'Online link', type: 'text', validate: urlValidator(false) },
    { name: 'description', type: 'textarea' },
    {
      name: 'registrationOpen',
      label: 'Registration open',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Registrations themselves arrive with the membership work.' },
    },
  ],
}
