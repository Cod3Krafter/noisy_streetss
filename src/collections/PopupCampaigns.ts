import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { datesOverlap, overlappingCampaignsWhere } from '@/rules/popups'
import { endsAfter, endsAfterField } from '@/rules/time'
import { finalValue, rejectField } from '@/rules/validation'

type SwitchingOn = { id?: number | string; headline: string; startsAt: string; endsAt: string }

const SWITCHING_ON = 'popupsSwitchingOn'

/** The campaigns this request has already checked as switched on. A bulk update shares one request. */
function switchingOnList(context: Record<string, unknown>): SwitchingOn[] {
  const existing = context[SWITCHING_ON]
  if (Array.isArray(existing)) return existing as SwitchingOn[]
  const list: SwitchingOn[] = []
  context[SWITCHING_ON] = list
  return list
}

const onlyOneAtATime: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const enabled = finalValue<boolean>(data, originalDoc, 'enabled')
  const startsAt = finalValue<string>(data, originalDoc, 'startsAt')
  const endsAt = finalValue<string>(data, originalDoc, 'endsAt')
  if (!enabled || !startsAt || !endsAt) return data
  // A backwards range gets its own field error from endsAt; don't report it as a clash.
  if (!endsAfter(startsAt, endsAt)) return data

  // A bulk update runs every record's hooks in parallel before any is written, so the database
  // check below can't see the others being switched on in the same operation. Check them here
  // and record this one before the first await, so two parallel hooks can't both slip past.
  const ownId = originalDoc?.id
  const headline = finalValue<string>(data, originalDoc, 'headline') ?? ''
  const batch = switchingOnList(req.context)
  const sibling = batch.find(
    (entry) => (ownId === undefined || entry.id !== ownId) && datesOverlap(startsAt, endsAt, entry.startsAt, entry.endsAt),
  )
  if (sibling) {
    rejectField(
      req,
      'popup-campaigns',
      'startsAt',
      `These dates overlap with "${sibling.headline}". Only one book popup can run at a time: change the dates or switch one off.`,
    )
  }
  batch.push({ id: ownId, headline, startsAt, endsAt })

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
