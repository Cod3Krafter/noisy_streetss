import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea' },
  ],
}
