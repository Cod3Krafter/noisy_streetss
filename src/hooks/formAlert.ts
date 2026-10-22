import type { CollectionAfterChangeHook } from 'payload'

export function adminEntryUrl(collectionSlug: string, id: number | string): string {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}/admin/collections/${collectionSlug}/${id}`
}

/**
 * Emails the site's form alert address when a new entry arrives, naming the form
 * and linking to the entry. A failed email is logged and never stops the entry saving.
 * The seed passes `context: { skipFormAlert: true }` so dummy entries send nothing.
 */
export const sendFormAlert =
  (formName: string): CollectionAfterChangeHook =>
  async ({ collection, context, doc, operation, req }) => {
    if (operation !== 'create' || context.skipFormAlert) return doc
    const name = formName.toLowerCase()
    try {
      const settings = await req.payload.findGlobal({ slug: 'site-settings', req })
      const to = settings.formAlertEmail
      if (!to) {
        req.payload.logger.warn(`No form alert address is set, so the new ${name} was not emailed.`)
        return doc
      }
      const link = adminEntryUrl(collection.slug, doc.id)
      await req.payload.sendEmail({
        to,
        subject: `New ${name} on the website`,
        text: `A new ${name} has arrived.\n\nOpen it in the admin: ${link}\n`,
        html: `<p>A new ${name} has arrived.</p><p><a href="${link}">Open it in the admin</a></p>`,
      })
    } catch (error) {
      req.payload.logger.error({ err: error, msg: `Could not send the alert for a new ${name}.` })
    }
    return doc
  }
