const filled = (value: unknown) =>
  typeof value === 'number' || (typeof value === 'string' && value.trim() !== '') || (typeof value === 'object' && value !== null)

/** A session needs a book or a title. Returns the message to show, or null when fine. */
export function bookOrTitleProblem(book: unknown, title: unknown): string | null {
  return filled(book) || filled(title) ? null : 'A session needs a book or a title.'
}
