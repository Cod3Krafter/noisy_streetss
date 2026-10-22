import { formCollection } from './formCollection'

export const ContactMessages = formCollection({
  slug: 'contact-messages',
  singular: 'Contact message',
  plural: 'Contact messages',
  titleField: 'name',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'subject', type: 'text' },
    { name: 'message', type: 'textarea', required: true },
  ],
})
