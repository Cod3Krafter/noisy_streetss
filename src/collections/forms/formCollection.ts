import type { Access, CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig, CollectionSlug, Field } from 'payload'

import { anyone, isAdmin, isStaff, isStaffUser } from '@/access'
import { sendFormAlert } from '@/hooks/formAlert'
import { createUnlessSpam, dropSpam, honeypotField } from '@/hooks/honeypot'

/** Whatever a visitor sends, their entry starts as New with no staff notes. */
const visitorEntriesStartNew: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== 'create' || isStaffUser(req.user)) return data
  return { ...data, status: 'new', staffNotes: null }
}

type FormCollectionArgs = {
  slug: string
  singular: string
  plural: string
  titleField: string
  fields: Field[]
  beforeValidate?: CollectionBeforeValidateHook[]
  /** Who may create entries. Defaults to anyone. */
  create?: Access
}

/**
 * An Inbox list for one website form: visitors create, staff read and update, admins delete.
 * A public form (created by anyone) answers spam with a pretend success; see `createUnlessSpam`.
 */
export function formCollection({ slug, singular, plural, titleField, fields, beforeValidate = [], create = anyone }: FormCollectionArgs): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      group: 'Inbox',
      useAsTitle: titleField,
      defaultColumns: [titleField, 'status', 'createdAt'],
    },
    access: { create, read: isStaff, update: isStaff, delete: isAdmin },
    // Only public forms: where visitors can't post at all, Payload's own route keeps refusing them.
    endpoints: create === anyone ? [createUnlessSpam(slug as CollectionSlug, singular)] : [],
    hooks: {
      beforeValidate: [dropSpam, ...beforeValidate],
      beforeChange: [visitorEntriesStartNew],
      afterChange: [sendFormAlert(singular)],
    },
    fields: [
      ...fields,
      honeypotField,
      {
        name: 'status',
        type: 'select',
        required: true,
        defaultValue: 'new',
        options: [
          { label: 'New', value: 'new' },
          { label: 'In progress', value: 'in-progress' },
          { label: 'Done', value: 'done' },
        ],
        admin: { position: 'sidebar' },
      },
      {
        name: 'staffNotes',
        label: 'Staff notes',
        type: 'textarea',
        admin: { position: 'sidebar', description: 'Only staff see this.' },
      },
    ],
  }
}
