import { formCollection } from './formCollection'

export const PartnershipEnquiries = formCollection({
  slug: 'partnership-enquiries',
  singular: 'Partnership enquiry',
  plural: 'Partnership enquiries',
  titleField: 'organisation',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'organisation', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
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
    { name: 'message', type: 'textarea', required: true },
  ],
})
