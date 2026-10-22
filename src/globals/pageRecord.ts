import type { Field, GlobalConfig } from 'payload'

import { anyone, isStaff } from '@/access'

/** One record per designed page: what editors can change on it. The layout itself is fixed in code. */
export function pageRecord(slug: string, label: string, extraFields: Field[] = []): GlobalConfig {
  return {
    slug,
    label,
    admin: {
      group: 'Pages',
      description: `Text and images on the ${label} page. The layout itself is fixed.`,
    },
    access: { read: anyone, update: isStaff },
    fields: [
      { name: 'heading', type: 'text', required: true },
      { name: 'intro', type: 'richText' },
      { name: 'heroImage', label: 'Hero image', type: 'upload', relationTo: 'media' },
      ...extraFields,
    ],
  }
}
