import { formCollection } from './formCollection'

export const BookstoreApplications = formCollection({
  slug: 'bookstore-applications',
  singular: 'Bookstore application',
  plural: 'Bookstore applications',
  titleField: 'storeName',
  fields: [
    { name: 'storeName', label: 'Store name', type: 'text', required: true },
    { name: 'contactName', label: 'Contact name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', required: true },
    {
      name: 'address',
      type: 'group',
      fields: [
        { name: 'line1', label: 'Street address', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
      ],
    },
    { name: 'websiteOrSocial', label: 'Website or social page', type: 'text' },
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
    { name: 'message', type: 'textarea' },
  ],
})
