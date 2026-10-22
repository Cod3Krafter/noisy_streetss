import { formCollection } from './formCollection'

export const AdvisoryEnquiries = formCollection({
  slug: 'advisory-enquiries',
  singular: 'Advisory enquiry',
  plural: 'Advisory enquiries',
  titleField: 'name',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'organisation', type: 'text', maxLength: 200 },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', maxLength: 50 },
    { name: 'needs', label: 'What they need', type: 'textarea', required: true, maxLength: 5000 },
  ],
})
