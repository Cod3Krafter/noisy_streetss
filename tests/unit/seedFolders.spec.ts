import { describe, expect, it } from 'vitest'

import { isInsideFolder } from '@/seed'

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
