import type { SanitizedConfig } from 'payload'
import { describe, expect, it } from 'vitest'

import { withStaffOnlyInternals } from '@/access/internalCollections'

const member = { id: 1, collection: 'members' }
const editor = { id: 2, collection: 'users', role: 'editor' }
const asArgs = (user: unknown) => ({ req: { user } }) as never

// A cut-down config: only the parts the function reads. Payload's defaults let any logged-in account in.
function fakeConfig(): SanitizedConfig {
  const anyLoggedIn = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)
  return {
    collections: [
      {
        slug: 'payload-locked-documents',
        access: { read: anyLoggedIn, create: anyLoggedIn, update: anyLoggedIn, delete: anyLoggedIn },
      },
    ],
    globals: [{ slug: 'payload-jobs-stats', access: { read: anyLoggedIn, update: anyLoggedIn } }],
  } as unknown as SanitizedConfig
}

describe('withStaffOnlyInternals', () => {
  it('makes the jobs stats global staff-only', async () => {
    const config = withStaffOnlyInternals(fakeConfig())
    const stats = config.globals.find((global) => (global.slug as string) === 'payload-jobs-stats')
    for (const operation of ['read', 'update'] as const) {
      const rule = stats?.access?.[operation]
      expect(rule, operation).toBeTypeOf('function')
      expect(await rule?.(asArgs(member)), operation).toBe(false)
      expect(await rule?.(asArgs(null)), operation).toBe(false)
      expect(await rule?.(asArgs(editor)), operation).toBe(true)
    }
  })

  it('makes the locks collection staff-only', async () => {
    const config = withStaffOnlyInternals(fakeConfig())
    const locks = config.collections.find((collection) => collection.slug === 'payload-locked-documents')
    for (const operation of ['read', 'create', 'update', 'delete'] as const) {
      const rule = locks?.access?.[operation]
      expect(await rule?.(asArgs(member)), operation).toBe(false)
      expect(await rule?.(asArgs(editor)), operation).toBe(true)
    }
  })

  it('leaves a config without either alone', () => {
    const bare = { collections: [], globals: [] } as unknown as SanitizedConfig
    expect(() => withStaffOnlyInternals(bare)).not.toThrow()
  })
})
