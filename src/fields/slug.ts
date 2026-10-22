import type { CollectionSlug, Field, FieldHook, PayloadRequest } from 'payload'

const MAX_LENGTH = 80
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Turns any text into a web address part: "Adéọlá & Co." becomes "adeola-and-co". */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, '')
}

async function firstFreeSlug(
  req: PayloadRequest,
  collection: CollectionSlug,
  base: string,
  ownId: number | string | undefined,
): Promise<string> {
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const { totalDocs } = await req.payload.count({
      collection,
      where: {
        and: [{ slug: { equals: candidate } }, ...(ownId ? [{ id: { not_equals: ownId } }] : [])],
      },
      req,
    })
    if (totalDocs === 0) return candidate
  }
  return `${base}-${Date.now()}`
}

const generateSlug =
  (sourceField: string): FieldHook =>
  async ({ value, data, originalDoc, collection, req }) => {
    if (typeof value === 'string' && value.trim() !== '') return slugify(value)

    const source = data?.[sourceField] ?? originalDoc?.[sourceField]
    if (typeof source !== 'string') return value
    const base = slugify(source)
    if (!base || !collection) return base || value

    return firstFreeSlug(req, collection.slug as CollectionSlug, base, originalDoc?.id)
  }

/** The `slug` field: made from `sourceField` when left empty, editable, unique in its collection. */
export function slugField(sourceField = 'title'): Field {
  return {
    name: 'slug',
    label: 'Web address',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'Made from the title when left empty. Lower-case letters, numbers and hyphens only.',
    },
    hooks: {
      beforeValidate: [generateSlug(sourceField)],
    },
    validate: (value: unknown) =>
      typeof value === 'string' && SLUG_PATTERN.test(value)
        ? true
        : 'Use lower-case letters, numbers and single hyphens only.',
  }
}
