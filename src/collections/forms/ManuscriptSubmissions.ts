import type { CollectionBeforeValidateHook } from 'payload'

import { isStaff } from '@/access'
import { callStatus } from '@/rules/submissionCalls'
import { rejectField } from '@/rules/validation'

import { formCollection } from './formCollection'

/** Submissions are only accepted while their call is published and open. */
const callMustBeOpen: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const raw = data?.call
  const callId = typeof raw === 'object' && raw !== null ? (raw as { id: number }).id : raw
  if (!callId) return data
  if (typeof callId !== 'number' && !(typeof callId === 'string' && /^d+$/.test(callId))) {
    rejectField(req, 'manuscript-submissions', 'call', 'Choose a submission call.')
  }

  const call = await req.payload.findByID({
    collection: 'submission-calls',
    id: callId as number,
    depth: 0,
    req,
    disableErrors: true,
  })
  const isOpen = call && call._status === 'published' && callStatus(call.opensAt, call.closesAt) === 'open'
  if (!isOpen) {
    rejectField(req, 'manuscript-submissions', 'call', 'This call for submissions is not open, so the manuscript could not be sent.')
  }
  return data
}

/** One uploaded file belongs to one submission. */
const fileUsedOnce: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const raw = data?.file
  const fileId = typeof raw === 'object' && raw !== null ? (raw as { id: number }).id : raw
  if (!fileId) return data
  const { totalDocs } = await req.payload.count({
    collection: 'manuscript-submissions',
    where: { file: { equals: fileId } },
    req,
  })
  if (totalDocs > 0) {
    rejectField(req, 'manuscript-submissions', 'file', 'This manuscript file is already attached to another submission.')
  }
  return data
}

export const ManuscriptSubmissions = formCollection({
  slug: 'manuscript-submissions',
  singular: 'Manuscript submission',
  plural: 'Manuscript submissions',
  titleField: 'workTitle',
  // Created only by the site's own server code (Local API), which also uploads the file. Visitors never post here directly.
  create: isStaff,
  beforeValidate: [callMustBeOpen, fileUsedOnce],
  fields: [
    { name: 'call', label: 'Submission call', type: 'relationship', relationTo: 'submission-calls', required: true },
    { name: 'name', type: 'text', required: true, maxLength: 200 },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text', maxLength: 50 },
    { name: 'workTitle', label: 'Title of the work', type: 'text', required: true, maxLength: 300 },
    { name: 'wordCount', label: 'Word count', type: 'number', min: 1 },
    { name: 'shortBio', label: 'Short bio', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'coverNote', label: 'Cover note', type: 'textarea', maxLength: 5000 },
    { name: 'file', label: 'Manuscript file', type: 'upload', relationTo: 'manuscripts', required: true },
  ],
})
