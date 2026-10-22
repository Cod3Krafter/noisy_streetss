import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { overlappingCampaignsWhere } from '@/rules/popups'
import { endsAfterField } from '@/rules/time'
import { finalValue, rejectField } from '@/rules/validation'

const onlyOneAtATime: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const enabled = finalValue<boolean>(data, originalDoc, 'enabled')
  const startsAt = finalValue<string>(data, originalDoc, 'startsAt')
  const endsAt = finalValue<string>(data, originalDoc, 'endsAt')
  if (!enabled || !startsAt || !endsAt) return data

  const clash = await req.payload.find({
    collection: 'popup-campaigns',
    where: overlappingCampaignsWhere(startsAt, endsAt, originalDoc?.id),
    limit: 1,
    depth: 0,
    req,
  })
  const other = clash.docs[0]
  if (other) {
    rejectField(
      req,
      'popup-campaigns',
      'startsAt',
      `These dates overlap with "${other.headline}". Only one book popup can run at a time: change the dates or switch one off.`,
    )
  }
  return data
}

export const PopupCampaigns: CollectionConfig = {
  slug: 'popup-campaigns',
  labels: { singular: 'Book popup', plural: 'Book popups' },
  admin: {
    group: "What's on",
    useAsTitle: 'headline',
    defaultColumns: ['headline', 'book', 'startsAt', 'endsAt', 'enabled'],
    description: 'Only one popup can be switched on for any given dates. Changes go live when saved.',
  },
  access: { read: anyone, ...staffWrites },
  hooks: { beforeValidate: [onlyOneAtATime] },
  fields: [
    { name: 'book', type: 'relationship', relationTo: 'books', required: true },
    { name: 'headline', type: 'text', required: true },
    { name: 'pitch', type: 'textarea' },
    { name: 'buttonLabel', label: 'Button text', type: 'text', admin: { placeholder: 'Buy the book' } },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', label: 'Show from', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        {
          name: 'endsAt',
          label: 'Show until',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          validate: endsAfterField('startsAt', 'The end must be after the start.', true),
        },
      ],
    },
    { name: 'enabled', label: 'Switched on', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
