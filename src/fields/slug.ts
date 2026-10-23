import type { CollectionSlug, Field, FieldHook, PayloadRequest } from 'payload'

import { wordsFromName } from '@/rules/references'
import { rejectField } from '@/rules/validation'

const MAX_LENGTH = 80
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const FORMAT_MESSAGE = 'Use lower-case letters, numbers and single hyphens only.'
const LENGTH_MESSAGE = `Keep the web address to ${MAX_LENGTH} characters or fewer.`

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

/** True when another record in the list already has this slug (the record being saved doesn't count). */
async function isTaken(
  req: PayloadRequest,
  collection: CollectionSlug,
  slug: string,
  ownId: number | string | undefined,
): Promise<boolean> {
  const { totalDocs } = await req.payload.count({
    collection,
    where: { and: [{ slug: { equals: slug } }, ...(ownId !== undefined ? [{ id: { not_equals: ownId } }] : [])] },
    req,
  })
  return totalDocs > 0
}

async function firstFreeSlug(
  req: PayloadRequest,
  collection: CollectionSlug,
  base: string,
  ownId: number | string | undefined,
): Promise<string> {
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? base : withSuffix(base, `-${n}`)
    if (!(await isTaken(req, collection, candidate, ownId))) return candidate
  }
  return withSuffix(base, `-${Date.now()}`)
}

/**
 * An address typed by a person is never changed: it is kept as typed or the save is refused, on
 * every save and for drafts too (draft saves skip field validation on most lists, so the check
 * is made here). An empty address is made from the source field, numbered when taken.
 */
const generateSlug =
  (sourceField: string): FieldHook =>
  async ({ value, data, originalDoc, collection, req }) => {
    if (typeof value === 'string' && value.trim() !== '') {
      if (!SLUG_PATTERN.test(value)) rejectField(req, collection?.slug ?? '', 'slug', FORMAT_MESSAGE)
      if (value.length > MAX_LENGTH) rejectField(req, collection?.slug ?? '', 'slug', LENGTH_MESSAGE)
      if (collection && (await isTaken(req, collection.slug as CollectionSlug, value, originalDoc?.id))) {
        const singular = typeof collection.labels?.singular === 'string' ? collection.labels.singular : wordsFromName(collection.slug)
        rejectField(req, collection.slug, 'slug', `Another ${singular.toLowerCase()} already uses this web address.`)
      }
      return value
    }

    const source = data?.[sourceField] ?? originalDoc?.[sourceField]
    if (typeof source !== 'string') return value
    const base = slugify(source)
    if (!base || !collection) return base || value

    return firstFreeSlug(req, collection.slug as CollectionSlug, base, originalDoc?.id)
  }

/** Empty as the hook sees it: nothing typed, or only spaces. The hook fills these in from the source field. */
const isEmpty = (value: unknown) => value == null || (typeof value === 'string' && value.trim() === '')

/**
 * The slug field's check. Payload passes `event: 'onChange'` from the admin's form-state check,
 * which runs this without the beforeValidate hook, so an empty value there would be flagged
 * although the save fills it in; it passes. Every save (admin, REST or local API) checks with
 * `event: 'submit'` after the hook has run, so an empty value is still refused there when the
 * hook had nothing to make a slug from. A malformed value is flagged in both.
 */
export const validateSlug = (value: unknown, { event }: { event?: 'onChange' | 'submit' } = {}): true | string => {
  if (event === 'onChange' && isEmpty(value)) return true
  if (typeof value !== 'string' || !SLUG_PATTERN.test(value)) return FORMAT_MESSAGE
  return value.length > MAX_LENGTH ? LENGTH_MESSAGE : true
}

/** The `slug` field: made from `sourceField` when left empty, editable, unique in its collection. */
export function slugField(sourceField = 'title'): Field {
  return {
    name: 'slug',
    label: 'Web address',
    type: 'text',
    // Not `required`: the slug is made in a hook when left empty, so creates may omit it.
    // validateSlug still refuses an empty or malformed slug on save.
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `Made from the ${sourceField} when left empty, adding -2 (or the next free number) if that address is already used. An address you type yourself must be unused and use only lower-case letters, numbers and single hyphens.`,
    },
    hooks: {
      // Payload's default for a unique field makes the copy's address "<slug> - Copy", which is not a valid
      // address. null makes it empty, so the copy's address is made from its title and numbered.
      beforeDuplicate: [() => null],
      beforeValidate: [generateSlug(sourceField)],
    },
    validate: validateSlug,
  }
}
