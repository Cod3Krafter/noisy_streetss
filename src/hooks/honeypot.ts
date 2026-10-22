import { APIError, type CollectionBeforeValidateHook, type Field } from 'payload'

/** Hidden from people, so only bots fill it in. Never stored. */
export const HONEYPOT_FIELD = 'website'

export const honeypotField: Field = {
  name: HONEYPOT_FIELD,
  type: 'text',
  virtual: true,
  admin: { hidden: true },
}

export const dropSpam: CollectionBeforeValidateHook = ({ data, operation }) => {
  const value = data?.[HONEYPOT_FIELD]
  if (operation === 'create' && value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')) {
    throw new APIError('This form could not be sent.', 400, null, true)
  }
  return data
}
