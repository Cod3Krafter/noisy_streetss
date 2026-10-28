/**
 * What a failed fetch is called in an error message: its name, and its cause code when it has one
 * (such as "TypeError: ENOTFOUND"). Never its message, which can quote the Authorization header and
 * so the key. This decides what of a network failure may reach the logs, so it exists only here.
 */
export function networkErrorLabel(error: unknown): string {
  const code = (error as { cause?: { code?: unknown } } | null)?.cause?.code
  return `${error instanceof Error ? error.name : 'Error'}${typeof code === 'string' ? `: ${code}` : ''}`
}
