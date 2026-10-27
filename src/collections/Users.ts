import { type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionBeforeOperationHook, type CollectionConfig, type PayloadRequest, type Where } from 'payload'

import { adminOnlyInAdmin, adminOrSelf, isAdmin, isAdminField, isAnyStaffUser } from '@/access'
import { pendingPublishesBy } from '@/jobs/scheduledPublishAlerts'
import { Refusal } from '@/refusal'
import { rejectField } from '@/rules/validation'

const LAST_ADMIN = 'There must always be at least one admin. Make another account an admin first.'

/**
 * Payload runs a bulk operation's per-document hooks at the same moment, so each one would still
 * see the other admins and let them all go. This runs once per operation instead: it works out
 * which accounts the operation targets and checks that an admin is left outside that set.
 * Payload gives this hook the name 'delete' or 'update' for both the by-id and the bulk form.
 *
 * A demotion that would leave no admin is refused as a whole, and so is a delete by id (the
 * record view shows the message, and there is no list to report into; the id may also be
 * written in a way Payload reads as a number, so it is not compared per record). A bulk
 * delete is refused per record instead: the admins that must stay are noted on the request
 * and `refuseKeptAdmin` refuses them one by one, so the list view's bulk Delete gets the
 * per-record answer it reads and the rest of the selection is still deleted. Those ids always
 * come from the found records.
 */
const keepAnAdmin: CollectionBeforeOperationHook = async ({ args, operation }) => {
  if (operation !== 'delete' && operation !== 'update') return args
  const input = args as { id?: number | string; where?: Where; data?: { role?: string }; req: PayloadRequest }
  const { req } = input
  // Set on every delete, so a value left by an earlier operation on this request can't apply.
  if (operation === 'delete') req.context.keepAdminIds = []
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
  if (input.id !== undefined) throw new Refusal(LAST_ADMIN)
  // Every admin is targeted, so every targeted admin stays and the rest of the selection goes.
  req.context.keepAdminIds = targeted
  return args
}

/** Bulk deletes only: refuses a record the operation hook marked as an admin that must stay. */
const refuseKeptAdmin: CollectionBeforeDeleteHook = ({ id, req }) => {
  const keep = req.context.keepAdminIds
  if (Array.isArray(keep) && keep.some((kept) => String(kept) === String(id))) throw new Refusal(LAST_ADMIN)
}

const SHOWN_PUBLISHES = 5

/**
 * Refuses deleting an account that has scheduled publishes still waiting: Payload's scheduled publish
 * looks the account up when it runs and fails if it is gone. Per record, so a bulk delete reports each
 * refusal and still deletes the rest.
 */
const refuseWhilePublishesWait: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const waiting = await pendingPublishesBy(req, id)
  if (waiting.length === 0) return
  const user = await req.payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true, req }).catch(() => null)
  const shown = waiting.slice(0, SHOWN_PUBLISHES).map((item) => `"${item.title}" (${item.when})`)
  const more = waiting.length > SHOWN_PUBLISHES ? `, and ${waiting.length - SHOWN_PUBLISHES} more` : ''
  const count = waiting.length === 1 ? '1 scheduled publish' : `${waiting.length} scheduled publishes`
  throw new Refusal(
    `${user?.name ?? 'This account'} has ${count} waiting: ${shown.join(', ')}${more}. ${waiting.length === 1 ? 'Cancel it' : 'Cancel them'} from ${waiting.length === 1 ? 'the' : 'each'} article's Schedule Publish, or ask another staff member to schedule ${waiting.length === 1 ? 'it' : 'them'} again, then delete the account.`,
  )
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
    admin: ({ req }) => isAnyStaffUser(req.user),
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [firstAccountIsAdmin],
    beforeDelete: [refuseKeptAdmin, refuseWhilePublishesWait],
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
        { label: 'Shop staff', value: 'shop' },
      ],
      access: { update: isAdminField },
      admin: {
        position: 'sidebar',
        description: 'Admins can also manage staff accounts and shop settings. Shop staff only see orders and the Stock page.',
      },
    },
  ],
}
