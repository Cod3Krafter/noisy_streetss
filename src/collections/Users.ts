import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionConfig } from 'payload'

import { adminOnlyInAdmin, adminOrSelf, isAdmin, isAdminField, isStaffUser } from '@/access'
import { rejectField } from '@/rules/validation'

const LAST_ADMIN = 'There must always be at least one admin. Make another account an admin first.'

async function otherAdmins(req: Parameters<CollectionBeforeDeleteHook>[0]['req'], id: number | string): Promise<number> {
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    where: { and: [{ role: { equals: 'admin' } }, { id: { not_equals: id } }] },
    req,
  })
  return totalDocs
}

/** Deleting the only admin would leave nobody able to manage staff or shop settings. */
const keepLastAdminOnDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const doc = await req.payload.findByID({ collection: 'users', id, depth: 0, req })
  if (doc.role === 'admin' && (await otherAdmins(req, id)) === 0) throw new APIError(LAST_ADMIN, 400, undefined, true)
}

/** Changing the only admin to an editor has the same effect. */
const keepLastAdminOnDemote: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== 'update' || originalDoc?.role !== 'admin' || data?.role === undefined || data.role === 'admin') return data
  if ((await otherAdmins(req, originalDoc.id)) === 0) rejectField(req, 'users', 'role', LAST_ADMIN)
  return data
}

/** The very first account is always an admin, so a fresh site can't be locked out. */
const firstAccountIsAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const { totalDocs } = await req.payload.count({ collection: 'users', req })
  return totalDocs === 0 ? { ...data, role: 'admin' } : data
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Staff account', plural: 'Staff accounts' },
  // The login cookie is only sent over https in production. Everything else stays at Payload's defaults.
  auth: { cookies: { secure: process.env.NODE_ENV === 'production' } },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
    hidden: adminOnlyInAdmin,
  },
  access: {
    admin: ({ req }) => isStaffUser(req.user),
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [firstAccountIsAdmin, keepLastAdminOnDemote],
    beforeDelete: [keepLastAdminOnDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: { update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Admins can also manage staff accounts and shop settings.',
      },
    },
  ],
}
