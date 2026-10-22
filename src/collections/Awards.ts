import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { urlValidator } from '@/rules/validators'

export const Awards: CollectionConfig = {
  slug: 'awards',
  labels: { singular: 'Award', plural: 'Awards' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      // Without this the database enum is named enum_awards_status, which clashes with the one Drafts adds for _status.
      enumName: 'award_status',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Judging', value: 'judging' },
        { label: 'Winners announced', value: 'winners-announced' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'rules', type: 'richText' },
    { name: 'prize', type: 'text', admin: { placeholder: '₦500,000 and publication' } },
    {
      name: 'keyDates',
      label: 'Key dates',
      type: 'array',
      labels: { singular: 'Date', plural: 'Dates' },
      fields: [
        { name: 'label', type: 'text', required: true, admin: { placeholder: 'Entries close' } },
        { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
      ],
    },
    {
      name: 'pastWinners',
      label: 'Past winners',
      type: 'array',
      labels: { singular: 'Winner', plural: 'Winners' },
      fields: [
        { name: 'year', type: 'number', required: true, min: 1900 },
        { name: 'name', type: 'text', required: true },
        { name: 'work', label: 'Winning work', type: 'text' },
        { name: 'url', label: 'Web address', type: 'text', validate: urlValidator(false) },
      ],
    },
    { name: 'howToEnter', label: 'How to enter', type: 'richText' },
    { name: 'entryUrl', label: 'Entry link', type: 'text', validate: urlValidator(false) },
    { name: 'cover', type: 'upload', relationTo: 'media' },
  ],
}
