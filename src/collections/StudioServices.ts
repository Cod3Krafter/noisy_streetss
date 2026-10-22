import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { ratesProblem } from '@/rules/studio'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { nairaValidator } from '@/rules/validators'

const requireARate: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = ratesProblem(
    finalValue(data, originalDoc, 'hourlyRateNGN'),
    finalValue(data, originalDoc, 'halfDayRateNGN'),
    finalValue(data, originalDoc, 'fullDayRateNGN'),
  )
  if (problem) rejectField(req, 'studio-services', 'hourlyRateNGN', problem)
  return data
}

export const StudioServices: CollectionConfig = {
  slug: 'studio-services',
  labels: { singular: 'Studio service', plural: 'Studio services' },
  admin: {
    group: 'Shop and services',
    useAsTitle: 'name',
    defaultColumns: ['name', 'bookable', 'sortOrder', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: { beforeValidate: [requireARate] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        { name: 'hourlyRateNGN', label: 'Hourly rate (₦)', type: 'number', validate: nairaValidator(false) },
        { name: 'halfDayRateNGN', label: 'Half day rate (₦)', type: 'number', validate: nairaValidator(false) },
        { name: 'fullDayRateNGN', label: 'Full day rate (₦)', type: 'number', validate: nairaValidator(false) },
      ],
    },
    {
      name: 'inclusions',
      label: "What's included",
      type: 'array',
      labels: { singular: 'Item', plural: 'Items' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'bookable',
      label: 'Can be booked online',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Booking itself arrives with the studio booking work.' },
    },
    { name: 'sortOrder', label: 'Order on the page', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}
