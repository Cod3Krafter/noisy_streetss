import { emailValidator } from '@/rules/validators'

import { formCollection } from './formCollection'

export const BookstoreApplications = formCollection({
  slug: 'bookstore-applications',
  singular: 'Bookstore application',
  plural: 'Bookstore applications',
  titleField: 'storeName',
  fields: [
    { name: 'storeName', label: 'Store name', type: 'text', required: true, maxLength: 200 },
    { name: 'contactName', label: 'Contact name', type: 'text', required: true, maxLength: 200 },
    { name: 'email', type: 'email', required: true, validate: emailValidator },
    { name: 'phone', type: 'text', required: true, maxLength: 50 },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'line1', label: 'Street address', type: 'text', required: true, maxLength: 200 },
        { name: 'city', type: 'text', required: true, maxLength: 200 },
        { name: 'state', type: 'text', required: true, maxLength: 200 },
      ],
    },
    { name: 'websiteOrSocial', label: 'Website or social page', type: 'text', maxLength: 300 },
    {
      name: 'storeType',
      label: 'Type of store',
      type: 'select',
      required: true,
      options: [
        { label: 'Independent bookstore', value: 'independent' },
        { label: 'Chain', value: 'chain' },
        { label: 'Online', value: 'online' },
        { label: 'Library', value: 'library' },
        { label: 'Other', value: 'other' },
      ],
    },
    { name: 'message', type: 'textarea', maxLength: 5000 },
  ],
})
