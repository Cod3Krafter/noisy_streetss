import { describe, expect, it } from 'vitest'

import { productionSettingProblems } from '@/rules/productionSettings'

const complete = {
  PAYLOAD_SECRET: 'a-long-secret-of-at-least-32-characters',
  SMTP_HOST: 'smtp.example.com',
  SMTP_FROM: 'Noisy Streetss <website@noisystreetss.example>',
  NEXT_PUBLIC_SERVER_URL: 'https://noisystreetss.example',
  CRON_SECRET: 'cron-secret-16-chars',
  S3_BUCKET_MEDIA: 'media',
  S3_BUCKET_MANUSCRIPTS: 'manuscripts',
  S3_ENDPOINT: 'https://s3.example.com',
  S3_REGION: 'eu-west-1',
  S3_ACCESS_KEY_ID: 'id',
  S3_SECRET_ACCESS_KEY: 'key',
}

describe('productionSettingProblems', () => {
  it('reports nothing when every setting is present', () => {
    expect(productionSettingProblems(complete)).toEqual([])
  })

  it('names every setting that is absent', () => {
    expect(productionSettingProblems({})).toEqual([
      'PAYLOAD_SECRET',
      'SMTP_HOST',
      'SMTP_FROM',
      'NEXT_PUBLIC_SERVER_URL',
      'CRON_SECRET',
      'S3_BUCKET_MEDIA',
      'S3_BUCKET_MANUSCRIPTS',
    ])
  })

  it('treats blank and whitespace-only values as missing', () => {
    expect(productionSettingProblems({ ...complete, CRON_SECRET: '', S3_BUCKET_MEDIA: '   ' })).toEqual([
      'CRON_SECRET',
      'S3_BUCKET_MEDIA',
    ])
  })
  it('also asks for the storage connection once a bucket is named', () => {
    const noStorage = { ...complete, S3_ENDPOINT: '', S3_REGION: undefined, S3_ACCESS_KEY_ID: '', S3_SECRET_ACCESS_KEY: '' }
    expect(productionSettingProblems(noStorage)).toEqual(['S3_ENDPOINT', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'])
    expect(productionSettingProblems({ ...noStorage, S3_BUCKET_MANUSCRIPTS: '' })).toEqual([
      'S3_BUCKET_MANUSCRIPTS',
      'S3_ENDPOINT',
      'S3_REGION',
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
    ])
  })

  it('treats a blank storage setting as missing', () => {
    expect(productionSettingProblems({ ...complete, S3_REGION: ' ' })).toEqual(['S3_REGION'])
  })

  it('says what is wrong with a short login secret', () => {
    expect(productionSettingProblems({ ...complete, PAYLOAD_SECRET: 'x'.repeat(31) })).toEqual([
      'PAYLOAD_SECRET (shorter than 32 characters)',
    ])
    expect(productionSettingProblems({ ...complete, PAYLOAD_SECRET: 'x'.repeat(32) })).toEqual([])
  })

  it('says what is wrong with a short cron secret', () => {
    expect(productionSettingProblems({ ...complete, CRON_SECRET: 'x'.repeat(15) })).toEqual([
      'CRON_SECRET (shorter than 16 characters)',
    ])
    expect(productionSettingProblems({ ...complete, CRON_SECRET: 'x'.repeat(16) })).toEqual([])
  })

  it('wants the site address as exactly https://host, lowercase, with no path, trailing slash or :443', () => {
    const problem = ['NEXT_PUBLIC_SERVER_URL (must be exactly https://host in lowercase, with no path, trailing slash or :443)']
    for (const url of ['https://noisystreetss.example/', 'https://noisystreetss.example/shop', 'http://noisystreetss.example', 'noisystreetss.example',
      'https://Noisystreetss.example', 'HTTPS://noisystreetss.example', 'https://noisystreetss.example:443', 'https://user@noisystreetss.example', 'https://\u00f1oisy.example', 'https://noisystreetss.example:']) {
      expect(productionSettingProblems({ ...complete, NEXT_PUBLIC_SERVER_URL: url })).toEqual(problem)
    }
    expect(productionSettingProblems({ ...complete, NEXT_PUBLIC_SERVER_URL: 'https://www.noisystreetss.example:8443' })).toEqual([])
    expect(productionSettingProblems({ ...complete, NEXT_PUBLIC_SERVER_URL: 'https://noisystreetss.com' })).toEqual([])
  })
})
