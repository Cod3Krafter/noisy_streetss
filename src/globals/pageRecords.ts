import type { Field, GlobalConfig } from 'payload'

import { pageRecord } from './pageRecord'

const submissionGuidelines: Field = {
  name: 'guidelines',
  label: 'General submission guidelines',
  type: 'richText',
  admin: { description: 'Applies to every call. Each call adds its own guidelines.' },
}

const PAGES: Array<[slug: string, label: string, extraFields?: Field[]]> = [
  ['page-home', 'Home'],
  ['page-publishing', 'Publishing'],
  ['page-writers', 'Writers'],
  ['page-submissions', 'Submissions', [submissionGuidelines]],
  ['page-awards', 'Awards'],
  ['page-advisory', 'Advisory'],
  ['page-distribution', 'Distribution'],
  ['page-studio', 'Studio'],
  ['page-blog', 'Blog'],
  ['page-podcast', 'Podcast'],
  ['page-shop', 'Shop'],
  ['page-book-club', 'Book Club'],
  ['page-membership', 'Membership'],
  ['page-events', 'Events'],
  ['page-careers', 'Careers'],
  ['page-who-we-are', 'Who We Are'],
  ['page-press', 'Press'],
  ['page-contact', 'Contact'],
  ['page-partner', 'Partner'],
  ['page-support', 'Support'],
]

export const pageRecords: GlobalConfig[] = PAGES.map(([slug, label, extraFields]) =>
  pageRecord(slug, label, extraFields),
)

export const pageRecordSlugs = pageRecords.map((global) => global.slug)
