import { type FlattenedField, type PayloadRequest, ValidationError } from 'payload'

import { wordsFromName } from '@/rules/references'

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

type FieldLabel = Exclude<FlattenedField['label'], false | undefined>

/**
 * The label the admin shows for the field at `path` (dotted through groups, tabs and arrays),
 * or a readable form of its name when it has none.
 */
function labelFor(req: PayloadRequest, collection: string, path: string): FieldLabel {
  const names = path.split('.').filter((part) => !/^\d+$/.test(part))
  let fields: FlattenedField[] | undefined = req.payload.collections[collection as keyof typeof req.payload.collections]?.config
    .flattenedFields
  let found: FlattenedField | undefined
  for (const name of names) {
    found = fields?.find((field) => field.name === name)
    fields = found && 'flattenedFields' in found ? found.flattenedFields : undefined
  }
  return (found?.label || undefined) ?? wordsFromName(names[names.length - 1] ?? path)
}

/**
 * Stops the save and shows `message` on the field at `path` in the admin. The error's own text
 * ("The following field is invalid: ...") names the field by its label, as the admin does.
 */
export function rejectField(req: PayloadRequest, collection: string, path: string, message: string): never {
  throw new ValidationError({ collection, errors: [{ label: labelFor(req, collection, path), path, message }], req }, req.t)
}
