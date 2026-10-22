import { seoPlugin } from '@payloadcms/plugin-seo'
import type { CollectionSlug, GlobalSlug } from 'payload'

import { pageRecordSlugs } from './globals/pageRecords'

type SeoSource = { title?: string; name?: string; heading?: string; summary?: string; shortBio?: string }

/** Meta title, description and sharing image on every type that has its own page. */
export const seo = seoPlugin({
  collections: ['books', 'writers', 'articles', 'podcast-episodes', 'awards', 'merch', 'pages'] as CollectionSlug[],
  globals: pageRecordSlugs as GlobalSlug[],
  uploadsCollection: 'media',
  tabbedUI: false,
  generateTitle: ({ doc }) => {
    const source = (doc ?? {}) as SeoSource
    const name = source.title ?? source.name ?? source.heading
    return name ? `${name} | Noisy Streetss` : 'Noisy Streetss'
  },
  generateDescription: ({ doc }) => {
    const source = (doc ?? {}) as SeoSource
    return source.summary ?? source.shortBio ?? ''
  },
})
