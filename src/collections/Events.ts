import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { endsAfterField } from '@/rules/time'
import { urlValidator } from '@/rules/validators'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  admin: {
    group: "What's on",
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'venue', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Starts', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'endsAt',
          label: 'Ends',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Optional. Leave empty for a single moment.' },
          validate: endsAfterField('startsAt', 'The end must be after the start.'),
        },
      ],
    },
    { name: 'venue', type: 'text' },
    { name: 'address', type: 'textarea' },
    { name: 'onlineUrl', label: 'Online link', type: 'text', validate: urlValidator(false) },
    { name: 'description', type: 'richText' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'actionUrl', label: 'Button link', type: 'text', validate: urlValidator(false) },
        { name: 'actionLabel', label: 'Button text', type: 'text', admin: { placeholder: 'Get tickets' } },
      ],
    },
  ],
}
