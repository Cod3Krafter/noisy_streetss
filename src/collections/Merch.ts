import type { CollectionConfig } from 'payload'

import { publishedOrStaffAccess } from '@/access'
import { slugField } from '@/fields/slug'
import { nairaValidator } from '@/rules/validators'

export const Merch: CollectionConfig = {
  slug: 'merch',
  labels: { singular: 'Merch item', plural: 'Merch' },
  admin: {
    group: 'Shop and services',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'priceNGN', 'inStock', '_status'],
  },
  access: publishedOrStaffAccess,
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true, required: true, minRows: 1 },
    { name: 'description', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
        { name: 'weightGrams', label: 'Weight (grams)', type: 'number', required: true, min: 1 },
      ],
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Stationery', value: 'stationery' },
        { label: 'Apparel', value: 'apparel' },
        { label: 'Other', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'inStock', label: 'In stock', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
