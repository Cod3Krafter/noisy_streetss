import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { publishedOrStaff, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { listenLinkProblem } from '@/rules/podcast'
import { finalValue, isPublishing, rejectField } from '@/rules/validation'
import { urlValidator } from '@/rules/validators'

const requireListenLink: CollectionBeforeValidateHook = ({ data, originalDoc, req }) => {
  if (!isPublishing(data, originalDoc)) return data
  const problem = listenLinkProblem(
    finalValue(data, originalDoc, 'spotifyUrl'),
    finalValue(data, originalDoc, 'youtubeUrl'),
  )
  if (problem) rejectField(req, 'podcast-episodes', 'spotifyUrl', problem)
  return data
}

export const PodcastEpisodes: CollectionConfig = {
  slug: 'podcast-episodes',
  labels: { singular: 'Podcast episode', plural: 'Podcast episodes' },
  admin: {
    group: 'Editorial',
    useAsTitle: 'title',
    defaultColumns: ['title', 'show', 'date', '_status'],
  },
  access: { read: publishedOrStaff, ...staffWrites },
  versions: { drafts: true, maxPerDoc: 50 },
  hooks: { beforeValidate: [requireListenLink] },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'show', type: 'relationship', relationTo: 'podcast-shows', required: true },
    {
      type: 'row',
      fields: [
        { name: 'episodeNumber', label: 'Episode number', type: 'number', min: 1 },
        { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
        { name: 'lengthMinutes', label: 'Length (minutes)', type: 'number', min: 1 },
      ],
    },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'showNotes', label: 'Show notes', type: 'richText' },
    {
      name: 'spotifyUrl',
      label: 'Spotify link',
      type: 'text',
      validate: urlValidator(false),
      admin: { description: 'A Spotify or YouTube link is needed before publishing.' },
    },
    { name: 'youtubeUrl', label: 'YouTube link', type: 'text', validate: urlValidator(false) },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'guests', type: 'relationship', relationTo: 'writers', hasMany: true },
  ],
}
