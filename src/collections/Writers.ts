import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { urlValidator } from '@/rules/validators'

export const Writers: CollectionConfig = {
  slug: 'writers',
  labels: { singular: 'Writer', plural: 'Writers' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'name',
    defaultColumns: ['name', 'showOnWritersPage', '_status', 'updatedAt'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'shortBio',
      label: 'Short bio',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: { description: 'One or two sentences, shown on cards and lists.' },
    },
    { name: 'bio', label: 'Full bio', type: 'richText' },
    {
      name: 'links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { placeholder: 'Instagram' } },
        { name: 'url', label: 'Web address', type: 'text', required: true, validate: urlValidator(true) },
      ],
    },
    {
      name: 'showOnWritersPage',
      label: 'Show on Our Writers',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'books',
      type: 'join',
      collection: 'books',
      on: 'writers',
      admin: { description: 'Filled in automatically from each book.' },
    },
  ],
}
