import type {
  CollectionSlug,
  FlattenedField,
  GlobalSlug,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  SelectType,
  Where,
} from 'payload'

import { RICH_TEXT_TARGETS } from '@/fields/richText'

/** One place a record is used: the record or page holding it, and the field it's in. */
export type Usage = {
  /** How staff know the holder: `Book popup "Spring sale"`, or a page such as `Site settings`. */
  holder: string
  /** The field's label in the admin, such as `Cover` or `Meta › Image`. */
  field: string
  /** Set for records in collections, so two records with the same title stay apart and a record never blocks itself. */
  record?: { collection: string; id: number | string }
}

/** What a reference points at. Ids are kept as strings, so 12 and "12" match. */
export type Ref = { relationTo: string; id: string }

const MAX_LISTED = 5

/** Payload's own collections point at everything (locks, preferences, jobs) and never count. */
const isInternal = (slug: string) => slug.startsWith('payload-')

/** 'heroImage' or 'site-settings' becomes 'Hero image' or 'Site settings', for anything without a label. */
export function wordsFromName(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function labelOf(field: FlattenedField): string {
  const label = 'label' in field ? field.label : undefined
  return typeof label === 'string' ? label : wordsFromName(field.name)
}

function singularOf(collection: SanitizedCollectionConfig): string {
  const singular = collection.labels?.singular
  return typeof singular === 'string' ? singular : wordsFromName(collection.slug)
}

/** The field a collection's records are named by; 'id' when it has none. */
const titleKey = (collection: SanitizedCollectionConfig): string => collection.admin.useAsTitle ?? 'id'

function titleOf(collection: SanitizedCollectionConfig, doc: Record<string, unknown>): string | undefined {
  const title = doc[titleKey(collection)]
  return typeof title === 'string' && title.trim() ? title : undefined
}

/** A record as the subject of the message: its title in quotes, or the list's name and its number. */
export function recordName(collection: SanitizedCollectionConfig, doc: Record<string, unknown>): string {
  const title = titleOf(collection, doc)
  return title ? `"${title}"` : `${singularOf(collection)} ${String(doc.id)}`
}

/** A record holding a reference: `Book popup "Spring sale"`, or `Image 12` when it has no title. */
function holderName(collection: SanitizedCollectionConfig, doc: Record<string, unknown>): string {
  const title = titleOf(collection, doc)
  return title ? `${singularOf(collection)} "${title}"` : `${singularOf(collection)} ${String(doc.id)}`
}

const idOf = (value: unknown): string | undefined => {
  if (typeof value === 'number' || (typeof value === 'string' && value !== '')) return String(value)
  if (value && typeof value === 'object' && 'id' in value) return idOf((value as { id: unknown }).id)
  return undefined
}

type LexicalNode = {
  type?: unknown
  relationTo?: unknown
  value?: unknown
  fields?: { linkType?: unknown; doc?: { relationTo?: unknown; value?: unknown } | null } | null
  children?: unknown
}

/** The records an editor has placed in rich text: images, relationship blocks and internal links. */
export function richTextRefs(value: unknown): Ref[] {
  const refs: Ref[] = []
  const visit = (node: LexicalNode) => {
    if ((node.type === 'upload' || node.type === 'relationship') && typeof node.relationTo === 'string') {
      const id = idOf(node.value)
      if (id) refs.push({ relationTo: node.relationTo, id })
    }
    if ((node.type === 'link' || node.type === 'autolink') && node.fields?.linkType === 'internal') {
      const doc = node.fields.doc
      const id = idOf(doc?.value)
      if (doc && typeof doc.relationTo === 'string' && id) refs.push({ relationTo: doc.relationTo, id })
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) if (child && typeof child === 'object') visit(child as LexicalNode)
    }
  }
  const root = value && typeof value === 'object' ? (value as { root?: unknown }).root : undefined
  if (root && typeof root === 'object') visit(root as LexicalNode)
  return refs
}

/** A field marked `custom: { deleteGuard: 'skip' }` never stops a delete (an order line's product). */
export const skippedByGuard = (field: FlattenedField) => (field.custom as { deleteGuard?: unknown } | undefined)?.deleteGuard === 'skip'

/** Relationship and upload fields, at any depth, that point at `target`: their query path and label. */
function referenceFields(fields: FlattenedField[], target: string, pathPrefix = '', labelPrefix = '') {
  const found: { path: string; label: string }[] = []
  for (const field of fields) {
    if (skippedByGuard(field)) continue
    const path = pathPrefix + field.name
    const label = labelPrefix + labelOf(field)
    if ((field.type === 'relationship' || field.type === 'upload') && field.relationTo === target) {
      found.push({ path, label })
    } else if (field.type === 'group' || field.type === 'tab' || field.type === 'array') {
      found.push(...referenceFields(field.flattenedFields, target, `${path}.`, `${label} › `))
    } else if (field.type === 'blocks') {
      for (const block of field.blocks) found.push(...referenceFields(block.flattenedFields, target, `${path}.`, `${label} › `))
    }
  }
  return found
}

/**
 * Every reference in one record's data, with the label of the field it sits in. Rich text is
 * always read; relationship and upload values only when `withFields` is set (collections answer
 * those by database query instead).
 */
function refsInData(fields: FlattenedField[], data: unknown, withFields: boolean, labelPrefix = ''): { ref: Ref; field: string }[] {
  const out: { ref: Ref; field: string }[] = []
  if (!data || typeof data !== 'object') return out
  const record = data as Record<string, unknown>
  for (const field of fields) {
    if (skippedByGuard(field)) continue
    const value = record[field.name]
    const label = labelPrefix + labelOf(field)
    if (field.type === 'richText') {
      for (const ref of richTextRefs(value)) out.push({ ref, field: label })
    } else if (withFields && (field.type === 'relationship' || field.type === 'upload') && typeof field.relationTo === 'string') {
      for (const item of Array.isArray(value) ? value : [value]) {
        const id = idOf(item)
        if (id) out.push({ ref: { relationTo: field.relationTo, id }, field: label })
      }
    } else if (field.type === 'group' || field.type === 'tab') {
      out.push(...refsInData(field.flattenedFields, value, withFields, `${label} › `))
    } else if (field.type === 'array' && Array.isArray(value)) {
      for (const row of value) out.push(...refsInData(field.flattenedFields, row, withFields, `${label} › `))
    } else if (field.type === 'blocks' && Array.isArray(value)) {
      for (const row of value) {
        const blockType = row && typeof row === 'object' ? (row as { blockType?: unknown }).blockType : undefined
        const block = field.blocks.find((candidate) => candidate.slug === blockType)
        if (block) out.push(...refsInData(block.flattenedFields, row, withFields, `${label} › `))
      }
    }
  }
  return out
}

/** The top-level fields whose data holds rich text somewhere inside, to limit what is read. */
function richTextFieldNames(fields: FlattenedField[]): string[] {
  const holds = (field: FlattenedField): boolean => {
    if (field.type === 'richText') return true
    if (field.type === 'group' || field.type === 'tab' || field.type === 'array') return field.flattenedFields.some(holds)
    if (field.type === 'blocks') return field.blocks.some((block) => block.flattenedFields.some(holds))
    return false
  }
  return fields.filter(holds).map((field) => field.name)
}

type Index = Map<string, Usage[]>

const refKey = (relationTo: string, id: number | string) => `${relationTo}:${String(id)}`

/** Rich text can only point at these lists, so a record in any other is never looked for there. */
const richTextTargets = new Set<string>(RICH_TEXT_TARGETS)

const passes = (collection: SanitizedCollectionConfig) => (collection.versions?.drafts ? [false, true] : [false])

/**
 * What one request has read, kept for the next record: a bulk delete calls the guard once per
 * record with the same request. Rich text across every collection is read once, on the first
 * delete that could be in it, and looked up by what it points at; each global is read once, on
 * the first delete it could hold. Neither depends on which list the record is in, so one request
 * that deletes from several lists still gets the right answers.
 */
type RequestReads = { richText?: Promise<Index>; globals: Map<string, Promise<{ ref: Ref; field: string }[]>> }

const reads = new WeakMap<PayloadRequest, RequestReads>()

function readsFor(req: PayloadRequest): RequestReads {
  let found = reads.get(req)
  if (!found) {
    found = { globals: new Map() }
    reads.set(req, found)
  }
  return found
}

async function buildRichTextIndex(req: PayloadRequest): Promise<Index> {
  const index: Index = new Map()
  const add = (ref: Ref, usage: Usage) => {
    const key = refKey(ref.relationTo, ref.id)
    index.set(key, [...(index.get(key) ?? []), usage])
  }

  for (const collection of req.payload.config.collections) {
    if (isInternal(collection.slug)) continue
    const names = richTextFieldNames(collection.flattenedFields)
    if (names.length === 0) continue
    const select = Object.fromEntries([titleKey(collection), ...names].map((name) => [name, true])) as SelectType
    for (const draft of passes(collection)) {
      const { docs } = await req.payload.find({
        collection: collection.slug as CollectionSlug,
        depth: 0,
        draft,
        overrideAccess: true,
        pagination: false,
        req,
        select,
      })
      for (const doc of docs as unknown as Record<string, unknown>[]) {
        const holder = holderName(collection, doc)
        for (const { ref, field } of refsInData(collection.flattenedFields, doc, false)) {
          add(ref, { holder, field, record: { collection: collection.slug, id: doc.id as number | string } })
        }
      }
    }
  }
  return index
}

/** Every reference a global holds, in fields and rich text, read once per request. */
function globalRefs(req: PayloadRequest, global: SanitizedGlobalConfig): Promise<{ ref: Ref; field: string }[]> {
  const cache = readsFor(req).globals
  let refs = cache.get(global.slug)
  if (!refs) {
    refs = req.payload
      .findGlobal({ slug: global.slug as GlobalSlug, depth: 0, overrideAccess: true, req })
      .then((data) => refsInData(global.flattenedFields, data, true))
    cache.set(global.slug, refs)
  }
  return refs
}

/**
 * Every place the record `target`/`id` is still used: relationship and upload fields in any
 * collection (published and latest draft), rich text anywhere, and the globals. Only what could
 * hold the record is read: a list or global with a field pointing at the record's list, and rich
 * text only when the record's list is one rich text can point at. A record's references to
 * itself don't count.
 */
export async function findUsages(req: PayloadRequest, target: string, id: number | string): Promise<Usage[]> {
  const usages: Usage[] = []
  const isTarget = (ref: Ref) => ref.relationTo === target && ref.id === String(id)
  const inRichText = richTextTargets.has(target)

  for (const collection of req.payload.config.collections) {
    if (isInternal(collection.slug)) continue
    const fields = referenceFields(collection.flattenedFields, target)
    if (fields.length === 0) continue
    // One query per pass for all of this list's fields; the fields that matched are read back
    // from the returned data, so each comes with the same label the field list gives it.
    const where: Where = { or: fields.map(({ path }) => ({ [path]: { in: [id] } })) }
    const holding = [titleKey(collection), ...fields.map(({ path }) => path.split('.')[0])]
    const select = Object.fromEntries(holding.map((name) => [name, true])) as SelectType
    const found: { doc: Record<string, unknown>; labels: Set<string> }[][] = []
    for (const draft of passes(collection)) {
      const { docs } = await req.payload.find({
        collection: collection.slug as CollectionSlug,
        depth: 0,
        draft,
        overrideAccess: true,
        pagination: false,
        req,
        select,
        where,
      })
      found.push(
        (docs as unknown as Record<string, unknown>[]).map((doc) => ({
          doc,
          labels: new Set(refsInData(collection.flattenedFields, doc, true).filter(({ ref }) => isTarget(ref)).map(({ field }) => field)),
        })),
      )
    }
    // Listed field by field, then pass by pass, so places and fields keep the order they had
    // when each field was asked for separately. Rich text matches are left to the index below.
    for (const label of new Set(fields.map((field) => field.label))) {
      for (const pass of found) {
        for (const { doc, labels } of pass) {
          if (labels.has(label)) usages.push({ holder: holderName(collection, doc), field: label, record: { collection: collection.slug, id: doc.id as number | string } })
        }
      }
    }
  }

  if (inRichText) {
    const cached = readsFor(req)
    cached.richText ??= buildRichTextIndex(req)
    usages.push(...((await cached.richText).get(refKey(target, id)) ?? []))
  }

  for (const global of req.payload.config.globals) {
    const holdsList = referenceFields(global.flattenedFields, target).length > 0
    const holdsRichText = inRichText && richTextFieldNames(global.flattenedFields).length > 0
    if (!holdsList && !holdsRichText) continue
    const holder = typeof global.label === 'string' ? global.label : wordsFromName(global.slug)
    for (const { ref, field } of await globalRefs(req, global)) if (isTarget(ref)) usages.push({ holder, field })
  }

  return usages.filter((usage) => !(usage.record?.collection === target && String(usage.record.id) === String(id)))
}

/** The plain message shown in the admin when a delete is refused. */
export function inUseMessage(name: string, usages: Usage[]): string {
  const places = new Map<string, { holder: string; fields: Set<string> }>()
  for (const usage of usages) {
    const key = usage.record ? refKey(usage.record.collection, usage.record.id) : usage.holder
    const place = places.get(key) ?? { holder: usage.holder, fields: new Set<string>() }
    place.fields.add(usage.field)
    places.set(key, place)
  }
  const described = [...places.values()].map(({ holder, fields }) => `${holder} (${[...fields].join(', ')})`)
  const listed = described.slice(0, MAX_LISTED).join('; ')
  const more = described.length > MAX_LISTED ? `; and ${described.length - MAX_LISTED} more` : ''
  return `${name} is still used by ${listed}${more}. Remove it from there first, then delete it.`
}
