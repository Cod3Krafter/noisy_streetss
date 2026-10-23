import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaffAccess } from '@/access'
import { slugField } from '@/fields/slug'
import { formatsProblem } from '@/rules/books'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { nairaValidator } from '@/rules/validators'

const requireFormatsWhenSold: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = formatsProblem(
    finalValue(data, originalDoc, 'sellInShop'),
    finalValue(data, originalDoc, 'formats'),
  )
  if (problem) rejectField(req, 'books', 'formats', problem)
  return data
}

export const Books: CollectionConfig = {
  slug: 'books',
  labels: { singular: 'Book', plural: 'Books' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'sellInShop', '_status', 'updatedAt'],
  },
  access: publishedOrStaffAccess,
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: {
    beforeValidate: [requireFormatsWhenSold],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'cover', type: 'upload', relationTo: 'media', required: true },
    { name: 'writers', type: 'relationship', relationTo: 'writers', hasMany: true, required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Fiction', value: 'fiction' },
        { label: 'Poetry', value: 'poetry' },
        { label: 'Anthology', value: 'anthology' },
        { label: 'Non-fiction', value: 'non-fiction' },
      ],
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
      maxLength: 160,
      admin: { description: 'One line, shown on book cards.' },
    },
    { name: 'synopsis', type: 'richText' },
    {
      type: 'row',
      fields: [
        { name: 'publishDate', label: 'Publication date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'pageCount', label: 'Pages', type: 'number', min: 1 },
        { name: 'isbn', label: 'ISBN', type: 'text' },
      ],
    },
    {
      name: 'formats',
      type: 'array',
      labels: { singular: 'Format', plural: 'Formats' },
      admin: { description: 'Each edition sold, such as paperback or hardback. Needed before the book can be sold.' },
      fields: [
        { name: 'formatName', label: 'Format', type: 'text', required: true, admin: { placeholder: 'Paperback' } },
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
        { name: 'inStock', label: 'In stock', type: 'checkbox', defaultValue: true },
        {
          name: 'weightGrams',
          label: 'Weight (grams)',
          type: 'number',
          required: true,
          min: 1,
          admin: { description: 'Used to work out delivery.' },
        },
      ],
    },
    { name: 'sellInShop', label: 'Sell in the shop', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'newRelease', label: 'New release', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'editorsChoice', label: "Editor's choice", type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
  ],
}
