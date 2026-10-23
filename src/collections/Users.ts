import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { adminOnlyInAdmin, adminOrSelf, isAdmin, isAdminField, isStaffUser } from '@/access'

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
