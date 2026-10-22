import { APIError, type CollectionBeforeOperationHook } from 'payload'

/** Rejects an upload larger than `maxBytes`. Payload only has a site-wide limit, not one per collection. */
export const rejectFilesOver =
  (maxBytes: number): CollectionBeforeOperationHook =>
  ({ operation, req }) => {
    if (operation !== 'create' && operation !== 'update') return
    const file = req.file
    if (!file) return
    const bytes = Math.max(file.size ?? 0, file.data?.length ?? 0)
    if (bytes > maxBytes) {
      const megabytes = Math.round(maxBytes / (1024 * 1024))
      throw new APIError(`The file must be ${megabytes} MB or smaller.`, 413, null, true)
    }
  }
