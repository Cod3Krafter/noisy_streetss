import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { endsAfterField } from '@/rules/time'
import { urlValidator } from '@/rules/validators'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: { singular: 'Announcement', plural: 'Announcements' },
  admin: {
    group: "What's on",
    useAsTitle: 'text',
    defaultColumns: ['text', 'startsAt', 'endsAt'],
    description: 'The home page shows up to 3 current announcements, newest first. Changes go live when saved.',
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'text', type: 'text', required: true, maxLength: 140 },
    {
      type: 'row',
      fields: [
        { name: 'url', label: 'Link', type: 'text', validate: urlValidator(false) },
        { name: 'buttonLabel', label: 'Button text', type: 'text', admin: { placeholder: 'Read more' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Show from', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'endsAt',
          label: 'Show until',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' }, description: 'Leave empty to keep showing it.' },
          validate: endsAfterField('startsAt', 'The end must be after the start.'),
        },
      ],
    },
  ],
}
