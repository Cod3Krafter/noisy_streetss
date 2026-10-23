import { describe, expect, it } from 'vitest'

import { missingProductionSettings } from '@/rules/productionSettings'

const complete = {
  SMTP_HOST: 'smtp.example.com',
  NEXT_PUBLIC_SERVER_URL: 'https://noisystreetss.example',
  CRON_SECRET: 'secret',
  S3_BUCKET_MEDIA: 'media',
  S3_BUCKET_MANUSCRIPTS: 'manuscripts',
}

describe('missingProductionSettings', () => {
  it('reports nothing when every setting is present', () => {
    expect(missingProductionSettings(complete)).toEqual([])
  })

  it('names every setting that is absent', () => {
    expect(missingProductionSettings({})).toEqual([
      'SMTP_HOST',
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
})
