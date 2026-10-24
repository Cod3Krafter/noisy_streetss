import type { Field } from 'payload'

type Empty = null | unknown[] | { [key: string]: Empty }

const isList = (field: Field): boolean =>
  field.type === 'array' ||
  field.type === 'blocks' ||
  ((field.type === 'select' || field.type === 'relationship' || field.type === 'upload') && 'hasMany' in field && field.hasMany === true)

/**
 * What every top-level field of a record looks like when empty: `null`, `[]` for a list, and for
 * a group each of its fields emptied the same way. Rows, collapsibles and tabs only lay fields
 * out, so their fields count as part of the record. Built from the config, so a field added
 * later is covered without touching the seed.
 */
export function emptyFieldData(fields: Field[]): Record<string, Empty> {
  const empty: Record<string, Empty> = {}
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible') {
      Object.assign(empty, emptyFieldData(field.fields))
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) empty[tab.name] = emptyFieldData(tab.fields)
        else Object.assign(empty, emptyFieldData(tab.fields))
      }
    } else if (field.type === 'ui' || !('name' in field) || !field.name || field.name === 'id') {
      continue
    } else if (field.type === 'group') {
      empty[field.name] = emptyFieldData(field.fields)
    } else {
      empty[field.name] = isList(field) ? [] : null
    }
  }
  return empty
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Lays the seeded values over the emptied record. A group is merged field by field, so a group the
 * seed sets only partly still has its other subfields emptied; anything else (a list, a rich text
 * value, an id) is replaced whole. An undefined seeded value counts as not set.
 */
export function mergeSeeded(empty: Record<string, unknown>, seeded: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...empty }
  for (const [key, value] of Object.entries(seeded)) {
    if (value === undefined) continue
    const base = empty[key]
    merged[key] = isPlainObject(base) && isPlainObject(value) ? mergeSeeded(base, value) : value
  }
  return merged
}
