import type { CollectionConfig } from 'payload'

import { publishedOrStaffAccess } from '@/access'
import { slugField } from '@/fields/slug'
import { nairaValidator } from '@/rules/validators'

/** Two options with the same name (ignoring case and spaces) would be impossible to tell apart. */
function distinctOptionNames(rows: unknown): true | string {
  if (!Array.isArray(rows)) return true
  const names = rows
    .map((row) => String((row as { name?: unknown } | null)?.name ?? '').trim().toLowerCase())
    .filter(Boolean)
  return new Set(names).size === names.length ? true : 'Each option needs a different name.'
}

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
    {
      name: 'options',
      type: 'array',
      labels: { singular: 'Option', plural: 'Options' },
      admin: {
        description: 'Sizes or other choices, such as S, M and L. Leave empty for a one-size item. Each option has its own In stock box.',
      },
      validate: distinctOptionNames,
      fields: [
        { name: 'name', label: 'Option', type: 'text', required: true, admin: { placeholder: 'M' } },
        { name: 'inStock', label: 'In stock', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'inStock',
      label: 'In stock',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        // With options, each option's own box decides instead.
        condition: (data) => !Array.isArray(data?.options) || data.options.length === 0,
      },
    },
  ],
}
