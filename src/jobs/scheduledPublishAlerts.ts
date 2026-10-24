import type { CollectionSlug, PayloadRequest, SanitizedConfig } from 'payload'

import { adminEntryUrl } from '@/hooks/formAlert'

type ScheduledInput = {
  type?: string
  doc?: { relationTo?: string; value?: string | number } | null
  global?: string | null
  user?: { relationTo?: string; value?: string | number } | null
}

const TIME_ZONE = 'Africa/Lagos'

/** "30 October 2026, 09:00", in the site's time zone, whatever the server's own is. */
export function readableDateTime(value: string | Date): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'no date set'
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? ''
  return `${part('day')} ${part('month')} ${part('year')}, ${part('hour')}:${part('minute')}`
}

/** The id as the database holds it: Payload keeps a job's document id as a string. */
function documentId(req: PayloadRequest, value: string | number): string | number {
  return req.payload.db.defaultIDType === 'number' ? Number(value) : value
}

/** The title of the document a job points at, or null when it can no longer be found. */
export async function scheduledDocumentTitle(req: PayloadRequest, input: ScheduledInput): Promise<string | null> {
  if (!input.doc?.relationTo || input.doc.value === undefined) return null
  try {
    const doc = await req.payload.findByID({
      collection: input.doc.relationTo as CollectionSlug,
      id: documentId(req, input.doc.value),
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    })
    const record = doc as unknown as Record<string, unknown>
    const title = record.title ?? record.name
    return typeof title === 'string' && title.trim() ? title : `Untitled (ID ${input.doc.value})`
  } catch {
    return null
  }
}

type PendingPublish = { title: string; when: string }

/** The scheduled publishes still waiting that this staff account queued, soonest first. */
export async function pendingPublishesBy(req: PayloadRequest, userId: number | string): Promise<PendingPublish[]> {
  const { docs } = await req.payload.find({
    collection: 'payload-jobs',
    where: { and: [{ taskSlug: { equals: 'schedulePublish' } }, { completedAt: { exists: false } }] },
    depth: 0,
    limit: 0,
    pagination: false,
    sort: 'waitUntil',
    overrideAccess: true,
    req,
  })
  const waiting: PendingPublish[] = []
  for (const job of docs) {
    if (job.hasError) continue
    const input = (job.input ?? {}) as ScheduledInput
    // The admin stores the account's id as a number or a string, so compare as text.
    if (input.user?.relationTo !== 'users' || String(input.user.value) !== String(userId)) continue
    const title = (await scheduledDocumentTitle(req, input)) ?? (input.global ? `the ${input.global} page` : 'an item that no longer exists')
    waiting.push({ title, when: job.waitUntil ? readableDateTime(job.waitUntil) : 'no date set' })
  }
  return waiting
}

/** The reason for a failure: a validation error's field messages, otherwise the error's own message. */
export function failureReason(error: unknown): string {
  const data = (error as { data?: { errors?: { label?: unknown; path?: unknown; message?: unknown }[] } } | null)?.data
  const fields = (data?.errors ?? [])
    .filter((entry) => typeof entry.message === 'string')
    .map((entry) => {
      const name = typeof entry.label === 'string' && entry.label ? entry.label : typeof entry.path === 'string' ? entry.path : ''
      return name ? `${name}: ${entry.message}` : String(entry.message)
    })
  if (fields.length > 0) return fields.join(' ')
  return error instanceof Error && error.message ? error.message : 'Unknown error.'
}

/** Emails the form alert address about a failed scheduled publish. Never throws. */
async function sendFailureAlert(req: PayloadRequest, input: ScheduledInput, error: unknown): Promise<void> {
  try {
    const settings = await req.payload.findGlobal({ slug: 'site-settings', req })
    const to = settings.formAlertEmail
    if (!to) {
      req.payload.logger.warn('No form alert address is set, so the failed scheduled publish was not emailed.')
      return
    }
    const title = await scheduledDocumentTitle(req, input)
    const what = input.global
      ? `the ${input.global} page`
      : title
        ? `"${title}"`
        : `an item that no longer exists (${input.doc?.relationTo ?? 'unknown'} ID ${input.doc?.value ?? 'unknown'})`
    const link =
      title && input.doc?.relationTo && input.doc.value !== undefined ? adminEntryUrl(input.doc.relationTo, input.doc.value) : null
    const reason = failureReason(error)
    const text = `The scheduled publish of ${what} did not go ahead.\n\nReason: ${reason}\n${link ? `\nOpen it in the admin: ${link}\n` : ''}`
    const html = `<p>The scheduled publish of ${escapeHtml(what)} did not go ahead.</p><p>Reason: ${escapeHtml(reason)}</p>${
      link ? `<p><a href="${link}">Open it in the admin</a></p>` : ''
    }`
    await req.payload.sendEmail({ to, subject: `A scheduled publish failed: ${what}`, text, html })
  } catch (alertError) {
    req.payload.logger.error({ err: alertError, msg: 'Could not send the alert for a failed scheduled publish.' })
  }
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Wraps Payload's own `schedulePublish` task so a failure emails the form alert address. Payload adds
 * that task while sanitising the config, so this runs on the finished config. Payload's `onFail`
 * callback would do, but it is not given the error; wrapping the handler keeps the reason. The
 * original error is rethrown, so Payload records the failure in the jobs list exactly as before.
 */
export function withScheduledPublishAlerts(config: SanitizedConfig): SanitizedConfig {
  const task = config.jobs?.tasks?.find((candidate) => candidate.slug === 'schedulePublish')
  if (!task || typeof task.handler !== 'function') return config
  const original = task.handler
  task.handler = async (args) => {
    try {
      return await original(args)
    } catch (error) {
      await sendFailureAlert(args.req, (args.input ?? {}) as ScheduledInput, error)
      throw error
    }
  }
  return config
}
