import { formCollection } from './formCollection'

export const AdvisoryEnquiries = formCollection({
  slug: 'advisory-enquiries',
  singular: 'Advisory enquiry',
  plural: 'Advisory enquiries',
  titleField: 'name',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'organisation', type: 'text' },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'needs', label: 'What they need', type: 'textarea', required: true },
  ],
})
