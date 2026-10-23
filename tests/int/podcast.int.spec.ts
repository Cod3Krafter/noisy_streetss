import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import type { PodcastShow } from '@/payload-types'

import { expectFieldError, getTestPayload } from '../helpers/payload'

let payload: Payload
let show: PodcastShow

const episode = (overrides: Record<string, unknown> = {}) => ({
  title: `Episode ${Math.random().toString(36).slice(2, 8)}`,
  show: show.id,
  date: new Date().toISOString(),
  summary: 'A test episode.',
  ...overrides,
})

beforeAll(async () => {
  payload = await getTestPayload()
  show = await payload.create({ collection: 'podcast-shows', data: { name: 'Noisy Conversations' } })
})

describe('podcast episodes', () => {
  it('refuses to publish an episode with no listening link', async () => {
    await expectFieldError(
      payload.create({ collection: 'podcast-episodes', data: episode({ _status: 'published' }) }),
      'spotifyUrl',
      /Spotify or YouTube/,
    )
  })

  it('names the listening link field by its label in the error message', async () => {
    await expect(payload.create({ collection: 'podcast-episodes', data: episode({ _status: 'published' }) })).rejects.toThrow(
      /The following field is invalid: Spotify link$/,
    )
  })

  it('publishes Spotify-only and YouTube-only episodes', async () => {
    const spotify = await payload.create({
      collection: 'podcast-episodes',
      data: episode({ spotifyUrl: 'https://open.spotify.com/episode/1', _status: 'published' }),
    })
    const youtube = await payload.create({
      collection: 'podcast-episodes',
      data: episode({ youtubeUrl: 'https://www.youtube.com/watch?v=abc', _status: 'published' }),
    })
    expect([spotify._status, youtube._status]).toEqual(['published', 'published'])
  })

  it('lets a draft have no link yet', async () => {
    const draft = await payload.create({ collection: 'podcast-episodes', data: episode(), draft: true })
    expect(draft._status).toBe('draft')
  })

  it('refuses a link that is not a web address', async () => {
    await expectFieldError(
      payload.create({
        collection: 'podcast-episodes',
        data: episode({ spotifyUrl: 'open.spotify.com/episode/1', _status: 'published' }),
      }),
      'spotifyUrl',
      /https/,
    )
  })

  it('shows visitors published episodes and every show', async () => {
    const episodes = await payload.find({ collection: 'podcast-episodes', overrideAccess: false })
    expect(episodes.docs.every((doc) => doc._status === 'published')).toBe(true)
    const shows = await payload.find({ collection: 'podcast-shows', overrideAccess: false })
    expect(shows.totalDocs).toBeGreaterThan(0)
  })
})
