type FieldNode = {
  type?: string
  relationTo?: string | string[]
  flattenedFields?: FieldNode[]
  blocks?: { flattenedFields?: FieldNode[] }[]
}

type CollectionNode = { slug: string; flattenedFields?: unknown }

/** Every collection slug the given fields point at, looking inside groups, arrays and blocks. */
function pointedAt(fields: FieldNode[] | undefined, into: Set<string>): void {
  for (const field of fields ?? []) {
    if ((field.type === 'relationship' || field.type === 'upload') && field.relationTo) {
      for (const slug of [field.relationTo].flat()) into.add(slug)
    }
    pointedAt(field.flattenedFields, into)
    for (const block of field.blocks ?? []) pointedAt(block.flattenedFields, into)
  }
}

/** For each collection, the collections its relationship and upload fields point at. */
function pointers(collections: CollectionNode[]): Map<string, Set<string>> {
  const targets = new Map<string, Set<string>>()
  for (const collection of collections) {
    const into = new Set<string>()
    pointedAt(collection.flattenedFields as FieldNode[] | undefined, into)
    targets.set(collection.slug, into)
  }
  return targets
}

/**
 * The given collections plus every collection that points at one of them, however far along, in
 * an order that is safe to empty: a collection comes before every collection it points at.
 *
 * This is a real dependency order, not the config order. The config follows the admin menu, and
 * a few reference columns are `NOT NULL` with `ON DELETE set null` (a popup's book, a manuscript
 * submission's call and file), so Postgres refuses to delete a book, call or manuscript that
 * a record still names. The seed's wipe passes every collection; the test helper passes the ones
 * a test file needs empty.
 */
export function deleteOrder(collections: CollectionNode[], slugs: string[]): string[] {
  const known = new Set(collections.map((collection) => collection.slug))
  const unknown = slugs.filter((slug) => !known.has(slug))
  if (unknown.length > 0) throw new Error(`deleteOrder: unknown collection in ${unknown.join(', ')}`)

  const targets = pointers(collections)
  const doomed = new Set(slugs)
  for (let grew = true; grew; ) {
    grew = false
    for (const [slug, pointsAt] of targets) {
      if (doomed.has(slug)) continue
      if ([...pointsAt].some((target) => doomed.has(target))) {
        doomed.add(slug)
        grew = true
      }
    }
  }

  // Repeatedly take a collection that no other remaining one points at. A cycle, if there ever
  // is one, is broken by taking the first remaining.
  const ordered: string[] = []
  const remaining = new Set(doomed)
  while (remaining.size > 0) {
    const next =
      [...remaining].find((slug) => ![...remaining].some((other) => other !== slug && targets.get(other)?.has(slug))) ??
      [...remaining][0]
    remaining.delete(next)
    ordered.push(next)
  }
  return ordered
}
