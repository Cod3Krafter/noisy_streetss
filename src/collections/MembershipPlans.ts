import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { nairaValidator } from '@/rules/validators'

export const MembershipPlans: CollectionConfig = {
  slug: 'membership-plans',
  labels: { singular: 'Membership plan', plural: 'Membership plans' },
  admin: {
    group: 'Shop and services',
    useAsTitle: 'name',
    defaultColumns: ['name', 'priceNGN', 'billing', 'active'],
    description: 'Changes go live as soon as they are saved.',
  },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
        {
          name: 'billing',
          type: 'select',
          required: true,
          options: [
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
          ],
        },
      ],
    },
    {
      name: 'perks',
      type: 'array',
      labels: { singular: 'Perk', plural: 'Perks' },
      fields: [{ name: 'perk', type: 'text', required: true }],
    },
    { name: 'active', label: 'Offered on the site', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'sortOrder', label: 'Order on the page', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
