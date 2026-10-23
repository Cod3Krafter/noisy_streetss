import {
  addDataAndFileToRequest,
  APIError,
  type CollectionBeforeValidateHook,
  type CollectionSlug,
  type Endpoint,
  type Field,
} from 'payload'

/** Hidden from people, so only bots fill it in. Never stored. */
export const HONEYPOT_FIELD = 'website'

export const honeypotField: Field = {
  name: HONEYPOT_FIELD,
  type: 'text',
  virtual: true,
  admin: { hidden: true },
}

/** True when the hidden field has anything in it, which only a bot does. */
export function isSpam(data: Record<string, unknown> | null | undefined): boolean {
  const value = data?.[HONEYPOT_FIELD]
  return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')
}

/**
 * A backstop for server code that saves an entry directly (the Local API), which doesn't go
 * through the endpoint below: an entry with the hidden field filled in is never stored. Server
 * code should check `isSpam` first and answer the visitor as if the entry had been sent.
 */
export const dropSpam: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation === 'create' && isSpam(data)) {
    throw new APIError('This form could not be sent.', 400, null, true)
  }
  return data
}

/**
 * Takes the place of Payload's own `POST /api/<form>` on a public form. A bot that fills in the
 * hidden field gets the same success response a person would, so it has no reason to try
 * again, but nothing is saved and no alert is sent. Anything else is created as Payload's own
 * route would: with the sender's access, and every hook (visitor entries start as New, staff are
 * alerted). The body can only be read once, so this creates the entry itself rather than
 * handing over to Payload's route. Form entries have no drafts or locales, so the query options
 * that route reads don't apply.
 */
export function createUnlessSpam(slug: CollectionSlug, singular: string): Endpoint {
  return {
    path: '/',
    method: 'post',
    handler: async (req) => {
      await addDataAndFileToRequest(req)
      const data = (req.data ?? {}) as Record<string, unknown>
      const message = req.t('general:successfullyCreated', { label: singular })
      if (isSpam(data)) {
        const echo = { ...data }
        delete echo[HONEYPOT_FIELD]
        const now = new Date().toISOString()
        return Response.json({ doc: { ...echo, status: 'new', createdAt: now, updatedAt: now }, message }, { status: 201 })
      }
      const doc = await req.payload.create({ collection: slug, data, depth: 0, overrideAccess: false, req })
      return Response.json({ doc, message }, { status: 201 })
    },
  }
}
