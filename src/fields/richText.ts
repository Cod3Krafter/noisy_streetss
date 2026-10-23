import {
  BlocksFeature,
  type FeatureProviderServer,
  LinkFeature,
  lexicalEditor,
  RelationshipFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import type { Block, CollectionSlug, UploadCollectionSlug } from 'payload'

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

/**
 * Rich text is shown on the public site, so it may only point at public records: images from
 * the media library, and links or relationships to collections that have public pages.
 * Staff accounts, manuscripts, form entries and the internal lists are left out.
 */
export const PUBLIC_LINK_COLLECTIONS: CollectionSlug[] = [
  'books',
  'writers',
  'articles',
  'podcast-episodes',
  'podcast-shows',
  'submission-calls',
  'awards',
  'events',
  'merch',
  'studio-services',
  'pages',
  'categories',
]

/** The lists rich text may place images from. */
const UPLOAD_COLLECTIONS: UploadCollectionSlug[] = ['media']

/**
 * Every list rich text can point at: placed images, relationship blocks and internal links.
 * Made from the same lists the editor is limited to below, so the delete guard, which reads
 * rich text only when the record being deleted is in one of these, can't drift from the editor.
 */
export const RICH_TEXT_TARGETS: CollectionSlug[] = [...UPLOAD_COLLECTIONS, ...PUBLIC_LINK_COLLECTIONS]

/** The default features with uploads, relationships and internal links limited to public collections. */
export function publicDefaultFeatures(defaultFeatures: FeatureProviderServer<unknown, unknown, unknown>[]) {
  return defaultFeatures.map((feature) => {
    if (feature.key === 'upload') return UploadFeature({ enabledCollections: UPLOAD_COLLECTIONS })
    if (feature.key === 'relationship') return RelationshipFeature({ enabledCollections: PUBLIC_LINK_COLLECTIONS })
    if (feature.key === 'link') return LinkFeature({ enabledCollections: PUBLIC_LINK_COLLECTIONS })
    return feature
  })
}

/** The default editor (headings, lists, links, quotes, images) plus video embeds. */
export const articleEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [...publicDefaultFeatures(defaultFeatures), BlocksFeature({ blocks: [VideoEmbed] })],
})
