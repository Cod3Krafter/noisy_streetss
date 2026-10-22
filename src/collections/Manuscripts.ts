import path from 'node:path'
import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '@/access'
import { rejectFilesOver } from '@/hooks/fileSizeLimit'

const TEN_MEGABYTES = 10 * 1024 * 1024

export const Manuscripts: CollectionConfig = {
  slug: 'manuscripts',
  labels: { singular: 'Manuscript file', plural: 'Manuscript files' },
  admin: {
    group: 'Inbox',
    useAsTitle: 'filename',
    description: 'Files sent with manuscript submissions. Only staff can open them.',
  },
  access: { read: isStaff, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    beforeOperation: [rejectFilesOver(TEN_MEGABYTES)],
  },
  upload: {
    // Outside public/: files are only served through Payload's access check.
    staticDir: process.env.MANUSCRIPTS_DIR || path.resolve(process.cwd(), 'manuscripts'),
    mimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  fields: [],
}
