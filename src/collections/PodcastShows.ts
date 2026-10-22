import type { CollectionConfig } from 'payload'

import { anyone, staffWrites } from '@/access'
import { slugField } from '@/fields/slug'
import { urlValidator } from '@/rules/validators'

export const PodcastShows: CollectionConfig = {
  slug: 'podcast-shows',
  labels: { singular: 'Podcast show', plural: 'Podcast shows' },
  admin: { group: 'Editorial', useAsTitle: 'name' },
  access: { read: anyone, ...staffWrites },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'description', type: 'textarea' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'spotifyUrl', label: 'Spotify link', type: 'text', validate: urlValidator(false) },
    { name: 'youtubeUrl', label: 'YouTube link', type: 'text', validate: urlValidator(false) },
    { name: 'appleUrl', label: 'Apple Podcasts link', type: 'text', validate: urlValidator(false) },
  ],
}
