import { addDataAndFileToRequest, type Endpoint, type PayloadRequest } from 'payload'

import { deliveryQuotes } from '@/shop/quotes'

/** The JSON body of a request, or an empty object. */
export async function bodyOf(req: PayloadRequest): Promise<Record<string, unknown>> {
  await addDataAndFileToRequest(req)
  return req.data && typeof req.data === 'object' ? (req.data as Record<string, unknown>) : {}
}

/** The shop's own endpoints under /api. Expected "no"s are Refusals, which Payload answers with their message. */
export const shopEndpoints: Endpoint[] = [
  {
    path: '/shop/quotes',
    method: 'post',
    handler: async (req) => Response.json(await deliveryQuotes(req, await bodyOf(req))),
  },
]
