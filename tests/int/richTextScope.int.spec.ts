import type { Field, Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { PUBLIC_LINK_COLLECTIONS } from '@/fields/richText'

import { getTestPayload } from '../helpers/payload'

let payload: Payload

beforeAll(async () => {
  payload = await getTestPayload()
})

type Props = { enabledCollectionSlugs?: string[]; fields?: Field[] }
type ResolvedEditor = { editorConfig: { resolvedFeatureMap: Map<string, { sanitizedServerFeatureProps?: Props }> } }

const sorted = (list: string[] | undefined) => list?.slice().sort()

describe('rich text scope', () => {
  const props = (key: string) =>
    (payload.config.editor as unknown as ResolvedEditor).editorConfig.resolvedFeatureMap.get(key)?.sanitizedServerFeatureProps

  it('limits uploads to the media library', () => {
    expect(props('upload')?.enabledCollectionSlugs).toEqual(['media'])
  })

  it('limits relationships to public collections', () => {
    expect(sorted(props('relationship')?.enabledCollectionSlugs)).toEqual(sorted(PUBLIC_LINK_COLLECTIONS))
  })

  it('limits internal links to public collections', () => {
    const doc = props('link')?.fields?.find((field) => 'name' in field && field.name === 'doc')
    const relationTo = doc && 'relationTo' in doc ? (doc.relationTo as string[]) : undefined
    expect(sorted(relationTo)).toEqual(sorted(PUBLIC_LINK_COLLECTIONS))
    for (const internal of ['users', 'manuscripts', 'contact-messages', 'manuscript-submissions']) {
      expect(relationTo).not.toContain(internal)
    }
  })
})
