import { APIError, type CollectionBeforeOperationHook } from 'payload'

/** Rejects an upload larger than `maxBytes`. Payload only has a site-wide limit, not one per collection. */
export const rejectFilesOver =
  (maxBytes: number): CollectionBeforeOperationHook =>
  ({ operation, req }) => {
    const tooBig = (operation === 'create' || operation === 'update') && req.file && req.file.size > maxBytes
    if (tooBig) {
      const megabytes = Math.round(maxBytes / (1024 * 1024))
      throw new APIError(`The file must be ${megabytes} MB or smaller.`, 413, null, true)
    }
  }
