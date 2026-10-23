import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { urlValidator } from '@/rules/validators'

export const PressMentions: CollectionConfig = {
  slug: 'press-mentions',
  labels: { singular: 'Press mention', plural: 'Press mentions' },
  admin: { group: 'About', useAsTitle: 'headline', defaultColumns: ['outlet', 'headline', 'date'] },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'outlet', type: 'text', required: true, admin: { placeholder: 'The Guardian Nigeria' } },
    { name: 'headline', type: 'text', required: true },
    { name: 'url', label: 'Link to the piece', type: 'text', required: true, validate: urlValidator(true) },
    { name: 'date', type: 'date', admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } } },
    { name: 'logo', type: 'upload', relationTo: 'media' },
    { name: 'quote', type: 'textarea', admin: { description: 'A short line from the piece, if there is a good one.' } },
  ],
}
