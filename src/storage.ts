import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

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
