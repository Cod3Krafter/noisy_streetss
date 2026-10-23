import { s3Storage } from '@payloadcms/storage-s3'
import type { Field, Plugin } from 'payload'

function s3ClientConfig() {
  return {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  }
}

/**
 * Supabase Storage in production, through its S3 interface. Each bucket switches on
 * only when its name is set, so locally files stay on disk. Files keep being served
 * through Payload, which checks read access first.
 */
export function storagePlugins(): Plugin[] {
  return [
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET_MEDIA),
      alwaysInsertFields: true,
      bucket: process.env.S3_BUCKET_MEDIA || '',
      collections: { media: true },
      config: s3ClientConfig(),
    }),
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET_MANUSCRIPTS),
      alwaysInsertFields: true,
      bucket: process.env.S3_BUCKET_MANUSCRIPTS || '',
      collections: { manuscripts: true },
      config: s3ClientConfig(),
    }),
  ]
}

const INTERNAL_FIELDS = new Set(['prefix', '_objectKey'])

/**
 * The storage adapter adds `prefix` and `_objectKey` to each upload list. It hides them on the
 * edit screen, but they would still be offered as list columns and filters. Runs after the
 * storage plugins, and only changes admin settings (no schema change).
 */
export const hideStorageFieldsFromLists: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((collection) => {
    if (collection.slug !== 'media' && collection.slug !== 'manuscripts') return collection
    return {
      ...collection,
      fields: collection.fields.map((field): Field => {
        if (!('name' in field) || !INTERNAL_FIELDS.has(field.name)) return field
        return { ...field, admin: { ...field.admin, disableListColumn: true, disableListFilter: true } } as Field
      }),
    }
  }),
})
