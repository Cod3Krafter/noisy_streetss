import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeOperationHook, type CollectionConfig, type PayloadRequest, type Where } from 'payload'

import { adminOnlyInAdmin, adminOrSelf, isAdmin, isAdminField, isStaffUser } from '@/access'
import { rejectField } from '@/rules/validation'

const LAST_ADMIN = 'There must always be at least one admin. Make another account an admin first.'

/**
 * Payload runs a bulk operation's per-document hooks at the same moment, so each one would still
 * see the other admins and let them all go. This runs once per operation instead: it works out
 * which accounts the operation targets and checks that an admin is left outside that set.
 * Payload gives this hook the name 'delete' or 'update' for both the by-id and the bulk form.
 */
const keepAnAdmin: CollectionBeforeOperationHook = async ({ args, operation }) => {
  if (operation !== 'delete' && operation !== 'update') return args
  const input = args as { id?: number | string; where?: Where; data?: { role?: string }; req: PayloadRequest }
  const { req } = input
  if (operation === 'update' && (input.data?.role === undefined || input.data.role === 'admin')) return args
  if (input.id === undefined && !input.where) return args

  const { docs } = await req.payload.find({
    collection: 'users',
    where: input.id !== undefined ? { id: { equals: input.id } } : input.where,
    depth: 0,
    limit: 0,
    pagination: false,
    req,
  })
  const targeted = docs.filter((doc) => doc.role === 'admin').map((doc) => doc.id)
  if (targeted.length === 0) return args

  const { totalDocs } = await req.payload.count({
    collection: 'users',
    where: { and: [{ role: { equals: 'admin' } }, { id: { not_in: targeted } }] },
    req,
  })
  if (totalDocs > 0) return args

  if (operation === 'update') rejectField(req, 'users', 'role', LAST_ADMIN)
  throw new APIError(LAST_ADMIN, 400, undefined, true)
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
    beforeChange: [firstAccountIsAdmin],
    beforeOperation: [keepAnAdmin],
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
