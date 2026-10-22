import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Basic page', plural: 'Basic pages' },
  admin: {
    group: 'About',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status'],
    description: 'Plain text pages: the legal pages and Values.',
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'body', type: 'richText', required: true },
  ],
}
