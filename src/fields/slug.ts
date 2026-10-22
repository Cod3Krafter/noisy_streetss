import type { CollectionSlug, Field, FieldHook, PayloadRequest } from 'payload'

const MAX_LENGTH = 80
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Letters that have no accent to strip, so Unicode normalising leaves them alone.
 * Written as escapes to keep this file plain ASCII: the Hausa hooked letters
 * (b, d, k, y, lower then upper case), then o, d, l with a stroke, ae, oe and the German sharp s.
 */
const PLAIN_LETTERS: Record<string, string> = {
  '\u0253': 'b',
  '\u0257': 'd',
  '\u0199': 'k',
  '\u01B4': 'y',
  '\u0181': 'B',
  '\u018A': 'D',
  '\u0198': 'K',
  '\u01B3': 'Y',
  '\u00F8': 'o',
  '\u00D8': 'O',
  '\u0111': 'd',
  '\u0110': 'D',
  '\u0142': 'l',
  '\u0141': 'L',
  '\u00E6': 'ae',
  '\u00C6': 'AE',
  '\u0153': 'oe',
  '\u0152': 'OE',
  '\u00DF': 'ss',
}
const PLAIN_LETTER_PATTERN = new RegExp(`[${Object.keys(PLAIN_LETTERS).join('')}]`, 'g')

/**
 * Turns any text into a web address part: "Ola & Sons, Ltd." becomes "ola-and-sons-ltd".
 * Accents are dropped, so an accented e comes out as a plain e.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(PLAIN_LETTER_PATTERN, (letter) => PLAIN_LETTERS[letter])
    .replace(/\p{M}/gu, '')
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, '')
}

/** Adds a suffix such as "-2" to a slug, shortening the slug first so the result stays within the limit. */
function withSuffix(base: string, suffix: string): string {
  return base.slice(0, MAX_LENGTH - suffix.length).replace(/-+$/, '') + suffix
}

async function firstFreeSlug(
  req: PayloadRequest,
  collection: CollectionSlug,
  base: string,
  ownId: number | string | undefined,
): Promise<string> {
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? base : withSuffix(base, `-${n}`)
    const { totalDocs } = await req.payload.count({
      collection,
      where: {
        and: [
          { slug: { equals: candidate } },
          ...(ownId !== undefined ? [{ id: { not_equals: ownId } }] : []),
        ],
      },
      req,
    })
    if (totalDocs === 0) return candidate
  }
  return withSuffix(base, `-${Date.now()}`)
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
    // Not `required`: the slug is made in a hook when left empty, so creates may omit it.
    // `validate` below still refuses an empty or malformed slug on save.
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `Made from the ${sourceField} when left empty. Lower-case letters, numbers and hyphens only.`,
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
