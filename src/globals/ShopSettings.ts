import type { GlobalConfig } from 'payload'

import { adminOnlyInAdmin, isAdmin } from '@/access'
import { nairaValidator } from '@/rules/validators'
import { overlappingStatesProblem } from '@/shop/flatPrice'
import { DEFAULT_BOX_WEIGHT_GRAMS, TERMINAL_DEFAULT_BOX } from '@/shop/settings'
import { NIGERIAN_STATES } from '@/shop/states'

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
            { name: 'state', type: 'select', options: NIGERIAN_STATES },
            { name: 'postcode', type: 'text', admin: { description: 'Couriers need it to collect.' } },
          ],
        },
        { name: 'country', type: 'text', defaultValue: 'Nigeria', admin: { readOnly: true } },
      ],
    },
    {
      name: 'flatDeliveryPrices',
      label: 'Flat delivery prices',
      type: 'array',
      labels: { singular: 'Area', plural: 'Areas' },
      admin: { description: 'Used when live courier prices are unavailable. Each area lists the states it covers.' },
      validate: (rows: unknown) => overlappingStatesProblem(rows as never) ?? true,
      fields: [
        { name: 'areaName', label: 'Area', type: 'text', required: true, admin: { placeholder: 'South West' } },
        { name: 'states', type: 'select', hasMany: true, required: true, options: NIGERIAN_STATES },
        { name: 'priceNGN', label: 'Price (₦)', type: 'number', required: true, validate: nairaValidator(true) },
      ],
    },
    {
      name: 'elsewherePriceNGN',
      label: 'Everywhere else (₦)',
      type: 'number',
      required: true,
      validate: nairaValidator(true),
      admin: { description: 'The flat price for any state not listed in an area.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'terminalPackagingId',
          label: 'Parcel box (Terminal packaging ID)',
          type: 'text',
          defaultValue: TERMINAL_DEFAULT_BOX,
          admin: { description: "Starts as Terminal's own 20 x 20 x 10 cm box." },
        },
        {
          name: 'boxWeightGrams',
          label: 'Box weight (grams)',
          type: 'number',
          defaultValue: DEFAULT_BOX_WEIGHT_GRAMS,
          min: 1,
        },
      ],
    },
    {
      name: 'memberDiscountPercent',
      label: 'Member discount on books (%)',
      type: 'number',
      defaultValue: 20,
      min: 0,
      max: 100,
      // Members and their discount arrive in B3. Kept, so B3 needs no migration for it.
      admin: { hidden: true },
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
