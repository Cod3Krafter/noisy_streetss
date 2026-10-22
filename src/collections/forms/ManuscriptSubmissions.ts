import type { CollectionBeforeValidateHook } from 'payload'

import { callStatus } from '@/rules/submissionCalls'
import { rejectField } from '@/rules/validation'

import { formCollection } from './formCollection'

/** Submissions are only accepted while their call is published and open. */
const callMustBeOpen: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const raw = data?.call
  const callId = typeof raw === 'object' && raw !== null ? (raw as { id: number }).id : raw
  if (!callId) return data

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

export const ManuscriptSubmissions = formCollection({
  slug: 'manuscript-submissions',
  singular: 'Manuscript submission',
  plural: 'Manuscript submissions',
  titleField: 'workTitle',
  beforeValidate: [callMustBeOpen],
  fields: [
    { name: 'call', label: 'Submission call', type: 'relationship', relationTo: 'submission-calls', required: true },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'workTitle', label: 'Title of the work', type: 'text', required: true },
    { name: 'wordCount', label: 'Word count', type: 'number', min: 1 },
    { name: 'shortBio', label: 'Short bio', type: 'textarea', required: true },
    { name: 'coverNote', label: 'Cover note', type: 'textarea' },
    { name: 'file', label: 'Manuscript file', type: 'upload', relationTo: 'manuscripts', required: true },
  ],
})
