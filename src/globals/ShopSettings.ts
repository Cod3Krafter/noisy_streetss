import type { GlobalConfig } from 'payload'

import { adminOnlyInAdmin, isAdmin } from '@/access'
import { nairaValidator } from '@/rules/validators'

export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Shop settings',
  admin: {
    group: 'Settings',
    hidden: adminOnlyInAdmin,
    description: 'Used by the shop and checkout. Only admins can see this.',
  },
  access: { read: isAdmin, update: isAdmin },
  fields: [
    {
      name: 'pickupAddress',
      label: 'Pickup address',
      type: 'group',
      admin: { description: 'Where couriers collect orders.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Contact name', type: 'text' },
            { name: 'phone', type: 'text' },
          ],
        },
        { name: 'line1', label: 'Street address', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text' },
            { name: 'state', type: 'text' },
            { name: 'country', type: 'text', defaultValue: 'Nigeria' },
          ],
        },
      ],
    },
    {
      name: 'flatDeliveryPrices',
      label: 'Flat delivery prices',
      type: 'array',
      labels: { singular: 'Area', plural: 'Areas' },
      admin: { description: 'Used when live courier prices are unavailable.' },
      fields: [
        { name: 'areaName', label: 'Area', type: 'text', required: true, admin: { placeholder: 'Lagos Mainland' } },
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
      ],
    },
    {
      name: 'memberDiscountPercent',
      label: 'Member discount on books (%)',
      type: 'number',
      defaultValue: 20,
      min: 0,
      max: 100,
    },
    {
      name: 'unpaidOrderExpiryMinutes',
      label: 'Unpaid orders expire after (minutes)',
      type: 'number',
      defaultValue: 30,
      min: 5,
    },
    { name: 'orderAlertEmail', label: 'Send order alerts to', type: 'email' },
  ],
}
