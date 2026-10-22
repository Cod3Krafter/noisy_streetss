import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

import { urlValidator } from '@/rules/validators'

export const VideoEmbed: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    {
      name: 'url',
      label: 'Video link',
      type: 'text',
      required: true,
      validate: urlValidator(true),
      admin: { description: 'A YouTube or Vimeo link.' },
    },
    { name: 'caption', type: 'text' },
  ],
}

/** The default editor (headings, lists, links, quotes, images) plus video embeds. */
export const articleEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [...defaultFeatures, BlocksFeature({ blocks: [VideoEmbed] })],
})
