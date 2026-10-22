import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'Tag', plural: 'Tags' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
  ],
}
