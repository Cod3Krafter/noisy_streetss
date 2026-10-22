import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { urlValidator } from '@/rules/validators'

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Person or organisation', plural: "People we've worked with" },
  admin: { group: 'About', useAsTitle: 'name', defaultColumns: ['name', 'sortOrder'] },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'quote', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'quoteBy', label: 'Quote by', type: 'text' },
        { name: 'quoteByTitle', label: 'Their role', type: 'text' },
      ],
    },
    { name: 'url', label: 'Web address', type: 'text', validate: urlValidator(false) },
    { name: 'sortOrder', label: 'Order on the page', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
