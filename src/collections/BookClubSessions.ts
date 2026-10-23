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

/** A session with a book but no typed title takes the book's title, so it never shows as untitled. */
const titleFromBook: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (finalValue(data, originalDoc, 'title')) return data
  const book = finalValue<number | { id: number } | null>(data, originalDoc, 'book')
  const id = typeof book === 'object' && book !== null ? book.id : book
  if (!id) return data
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
