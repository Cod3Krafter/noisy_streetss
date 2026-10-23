import { describe, expect, it } from 'vitest'

import { missingProductionSettings } from '@/rules/productionSettings'

const complete = {
  SMTP_HOST: 'smtp.example.com',
  SMTP_FROM: 'Noisy Streetss <website@noisystreetss.example>',
  NEXT_PUBLIC_SERVER_URL: 'https://noisystreetss.example',
  CRON_SECRET: 'secret',
  S3_BUCKET_MEDIA: 'media',
  S3_BUCKET_MANUSCRIPTS: 'manuscripts',
  S3_ENDPOINT: 'https://s3.example.com',
  S3_REGION: 'eu-west-1',
  S3_ACCESS_KEY_ID: 'id',
  S3_SECRET_ACCESS_KEY: 'key',
}

describe('missingProductionSettings', () => {
  it('reports nothing when every setting is present', () => {
    expect(missingProductionSettings(complete)).toEqual([])
  })

  it('names every setting that is absent', () => {
    expect(missingProductionSettings({})).toEqual([
      'SMTP_HOST',
      'SMTP_FROM',
      'NEXT_PUBLIC_SERVER_URL',
      'CRON_SECRET',
      'S3_BUCKET_MEDIA',
      'S3_BUCKET_MANUSCRIPTS',
    ])
  })

  it('treats blank and whitespace-only values as missing', () => {
    expect(missingProductionSettings({ ...complete, CRON_SECRET: '', S3_BUCKET_MEDIA: '   ' })).toEqual([
      'CRON_SECRET',
      'S3_BUCKET_MEDIA',
    ])
  })
  it('also asks for the storage connection once a bucket is named', () => {
    const noStorage = { ...complete, S3_ENDPOINT: '', S3_REGION: undefined, S3_ACCESS_KEY_ID: '', S3_SECRET_ACCESS_KEY: '' }
    expect(missingProductionSettings(noStorage)).toEqual(['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'])
    expect(missingProductionSettings({ ...noStorage, S3_BUCKET_MANUSCRIPTS: '' })).toEqual([
      'S3_BUCKET_MANUSCRIPTS',
      'S3_ENDPOINT',
      'S3_REGION',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
    ])
  })

  it('treats a blank storage setting as missing', () => {
    expect(missingProductionSettings({ ...complete, S3_REGION: ' ' })).toEqual(['S3_REGION'])
  })
})
