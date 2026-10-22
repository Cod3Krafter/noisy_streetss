import { describe, expect, it } from 'vitest'

import { listenLinkProblem } from '@/rules/podcast'

describe('listenLinkProblem', () => {
  it('accepts Spotify only, YouTube only, or both', () => {
    expect(listenLinkProblem('https://open.spotify.com/episode/1', undefined)).toBeNull()
    expect(listenLinkProblem('', 'https://youtu.be/abc')).toBeNull()
    expect(listenLinkProblem('https://open.spotify.com/episode/1', 'https://youtu.be/abc')).toBeNull()
  })

  it('needs at least one', () => {
    expect(listenLinkProblem(undefined, null)).toMatch(/Spotify or YouTube/)
    expect(listenLinkProblem('  ', '')).toMatch(/Spotify or YouTube/)
  })
})
