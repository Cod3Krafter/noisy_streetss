import { emailValidator } from '@/rules/validators'

import { formCollection } from './formCollection'

export const ContactMessages = formCollection({
  slug: 'contact-messages',
  singular: 'Contact message',
  plural: 'Contact messages',
  titleField: 'name',
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'email', type: 'email', required: true, validate: emailValidator },
    { name: 'subject', type: 'text', maxLength: 200 },
    { name: 'message', type: 'textarea', required: true, maxLength: 5000 },
  ],
})
