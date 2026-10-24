import { emailValidator } from '@/rules/validators'

import { formCollection } from './formCollection'

export const PartnershipEnquiries = formCollection({
  slug: 'partnership-enquiries',
  singular: 'Partnership enquiry',
  plural: 'Partnership enquiries',
  titleField: 'organisation',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'organisation', type: 'text', required: true, maxLength: 200 },
    { name: 'email', type: 'email', required: true, validate: emailValidator },
    { name: 'phone', type: 'text', maxLength: 50 },
    {
      name: 'partnershipType',
      label: 'Type of partnership',
      type: 'select',
      required: true,
      options: [
        { label: 'Sponsorship', value: 'sponsorship' },
        { label: 'Advertising', value: 'advertising' },
        { label: 'Media', value: 'media' },
        { label: 'Events', value: 'events' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'message', type: 'textarea', required: true, maxLength: 5000 },
  ],
})
