/** A book for sale needs at least one format. Returns the message to show, or null when fine. */
export function formatsProblem(sellInShop: unknown, formats: unknown): string | null {
  if (sellInShop !== true) return null
  return Array.isArray(formats) && formats.length > 0
    ? null
    : 'Add at least one format, with its price and weight, before selling this book in the shop.'
}
