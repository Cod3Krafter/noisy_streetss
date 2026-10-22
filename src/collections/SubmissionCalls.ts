import type { CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { callStatus } from '@/rules/submissionCalls'
import { endsAfterField } from '@/rules/time'

export const SubmissionCalls: CollectionConfig = {
  slug: 'submission-calls',
  labels: { singular: 'Submission call', plural: 'Submission calls' },
  admin: {
    group: 'Publishing',
    useAsTitle: 'title',
    defaultColumns: ['title', 'opensAt', 'closesAt', 'status', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  // The virtual status is worked out from these two, so a select that asks only for status must still load them.
  forceSelect: { opensAt: true, closesAt: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'status',
      label: 'Call status',
      type: 'select',
      virtual: true,
      options: [
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
      ],
      admin: {
        readOnly: true,
        position: 'sidebar',
        // A virtual field has no column to filter on.
        disableListFilter: true,
        description: 'Worked out from the opening and closing dates.',
      },
      hooks: {
        afterRead: [({ siblingData }) => callStatus(siblingData?.opensAt, siblingData?.closesAt)],
      },
    },
    {
      name: 'themeSummary',
      label: 'Theme in brief',
      type: 'textarea',
      required: true,
      admin: { description: 'Shown on the Submissions page.' },
    },
    { name: 'guidelines', type: 'richText', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'opensAt',
          label: 'Opens',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'closesAt',
          label: 'Closes',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          validate: endsAfterField('opensAt', 'The closing date must be after the opening date.', true),
        },
      ],
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
  ],
}
