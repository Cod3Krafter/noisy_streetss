import { type PayloadRequest, ValidationError } from 'payload'

type Doc = Record<string, unknown> | null | undefined

/** The value a save ends up with: the incoming one if it was sent, otherwise the stored one. */
export function finalValue<T = unknown>(data: Doc, originalDoc: Doc, key: string): T | undefined {
  if (data && key in data) return data[key] as T | undefined
  return originalDoc?.[key] as T | undefined
}

/** False while an editor is only saving a draft. Rules that guard published content skip drafts. */
export function isPublishing(data: Doc, originalDoc: Doc): boolean {
  return finalValue(data, originalDoc, '_status') !== 'draft'
}

/** Stops the save and shows `message` on the field at `path` in the admin. */
export function rejectField(req: PayloadRequest, collection: string, path: string, message: string): never {
  throw new ValidationError({ collection, errors: [{ path, message }], req }, req.t)
}
