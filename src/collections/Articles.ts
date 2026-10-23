import type { CollectionConfig } from 'payload'

import { publishedOrStaffAccess } from '@/access'
import { articleEditor } from '@/fields/richText'
import { slugField } from '@/fields/slug'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article', plural: 'Articles' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishDate', 'featured', '_status'],
    description:
      'An article can only be saved, even as a draft, once its title, summary, body, writer, category and publication date are filled in. That way a scheduled publish never fails.',
  },
  access: publishedOrStaffAccess,
  versions: {
    // Drafts are checked like a publish, so a scheduled publish can never fail on a missing field.
    drafts: { schedulePublish: true, validate: true },
    maxPerDoc: 50,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: { description: 'One or two sentences, shown on article cards.' },
    },
    { name: 'body', type: 'richText', required: true, editor: articleEditor },
    { name: 'writers', type: 'relationship', relationTo: 'writers', hasMany: true, required: true },
    { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true, required: true },
    { name: 'tags', type: 'relationship', relationTo: 'tags', hasMany: true },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Featured articles lead the Blog page.' },
    },
    {
      name: 'publishDate',
      label: 'Publication date',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Shown on the article. To publish later, use Schedule publish next to the Publish button.',
      },
    },
  ],
}
