import { type CollectionBeforeDeleteHook, type CollectionConfig, type CollectionSlug } from 'payload'

import { Refusal } from '@/refusal'
import { findUsages, inUseMessage, recordName } from '@/rules/references'

/**
 * Refuses to delete a record that another record, or a page, still points at, and says where.
 * Without it, deleting a book a popup uses fails with a database error staff can't read, and on
 * lists with drafts the pointer is silently emptied. In a bulk delete only the records still in
 * use are refused; the others are deleted, and each refusal is listed with its own message.
 */
export const refuseDeleteWhileInUse: CollectionBeforeDeleteHook = async ({ collection, id, req }) => {
  const usages = await findUsages(req, collection.slug, id)
  if (usages.length === 0) return
  const doc = await req.payload.findByID({
    collection: collection.slug as CollectionSlug,
    id,
    depth: 0,
    disableErrors: true,
    overrideAccess: true,
    req,
  })
  const name = recordName(collection, (doc as Record<string, unknown> | null) ?? { id })
  throw new Refusal(inUseMessage(name, usages))
}

/** Adds the guard to every collection, ahead of any delete hooks of its own. */
export function guardDeletes(collections: CollectionConfig[]): CollectionConfig[] {
  return collections.map((collection) => ({
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeDelete: [refuseDeleteWhileInUse, ...(collection.hooks?.beforeDelete ?? [])],
    },
  }))
}
