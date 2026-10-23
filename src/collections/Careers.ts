import type { CollectionConfig } from 'payload'

import { publishedOrStaffAccess } from '@/access'

export const Careers: CollectionConfig = {
  slug: 'careers',
  labels: { singular: 'Role', plural: 'Careers' },
  admin: {
    group: "What's on",
    useAsTitle: 'role',
    defaultColumns: ['role', 'type', 'closingDate', 'open', '_status'],
    description: 'Shown on the Careers page while switched on, until the end of the closing date.',
  },
  access: publishedOrStaffAccess,
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'role', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contract', value: 'contract' },
        { label: 'Internship', value: 'internship' },
        { label: 'NYSC', value: 'nysc' },
      ],
    },
    { name: 'location', type: 'text', admin: { placeholder: 'Lagos, or remote' } },
    { name: 'description', type: 'richText', required: true },
    { name: 'howToApply', label: 'How to apply', type: 'textarea', required: true },
    {
      name: 'closingDate',
      label: 'Closing date',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' }, description: 'The role still shows on this day.' },
    },
    { name: 'open', label: 'Accepting applications', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
