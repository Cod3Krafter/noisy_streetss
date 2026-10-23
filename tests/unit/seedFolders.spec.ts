import { describe, expect, it } from 'vitest'

import { isInsideFolder, isSeedUploadFolder } from '@/seed'

describe('isInsideFolder', () => {
  it('accepts a folder strictly inside the root', () => {
    expect(isInsideFolder('C:/proj/media', 'C:/proj')).toBe(true)
  })

  it('refuses the root itself', () => {
    expect(isInsideFolder('C:/proj', 'C:/proj')).toBe(false)
  })

  it('refuses a parent', () => {
    expect(isInsideFolder('C:/', 'C:/proj')).toBe(false)
  })

  it('refuses a sibling folder', () => {
    expect(isInsideFolder('C:/other/media', 'C:/proj')).toBe(false)
  })

  it('refuses a path that climbs out', () => {
    expect(isInsideFolder('C:/proj/../x', 'C:/proj')).toBe(false)
  })
})

describe('isSeedUploadFolder', () => {
  it('accepts the media and manuscripts folders', () => {
    expect(isSeedUploadFolder('C:/proj/media', 'C:/proj')).toBe(true)
    expect(isSeedUploadFolder('C:/proj/manuscripts', 'C:/proj')).toBe(true)
  })

  it('accepts folders inside .test-uploads', () => {
    expect(isSeedUploadFolder('C:/proj/.test-uploads/media', 'C:/proj')).toBe(true)
    expect(isSeedUploadFolder('C:/proj/.test-uploads/manuscripts', 'C:/proj')).toBe(true)
  })

  it('refuses src and other project folders', () => {
    expect(isSeedUploadFolder('C:/proj/src', 'C:/proj')).toBe(false)
    expect(isSeedUploadFolder('C:/proj/public', 'C:/proj')).toBe(false)
    expect(isSeedUploadFolder('C:/proj/media/nested', 'C:/proj')).toBe(false)
  })

  it('refuses the root, .test-uploads itself, and folders outside the project', () => {
    expect(isSeedUploadFolder('C:/proj', 'C:/proj')).toBe(false)
    expect(isSeedUploadFolder('C:/proj/.test-uploads', 'C:/proj')).toBe(false)
    expect(isSeedUploadFolder('C:/other/media', 'C:/proj')).toBe(false)
    expect(isSeedUploadFolder('C:/proj/.test-uploads/../src', 'C:/proj')).toBe(false)
  })
})
