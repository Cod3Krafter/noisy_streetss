import { APIError } from 'payload'

/** The name Payload's logger sees for a Refusal, set in the Payload config to log at `info`. */
export const REFUSAL = 'Refusal'

/**
 * An expected "no": a delete refused because the record is still used, the last admin kept,
 * a spam entry refused, a file over the size limit. The person sees the message as with any
 * other error, but the logs get a one-line note instead of an error with a stack trace, so
 * real faults still stand out.
 */
export class Refusal extends APIError {
  /** `data` travels in the error body (errors[0].data), for a caller that must tell refusals apart without reading the message. */
  constructor(message: string, status = 400, data: Record<string, unknown> | null = null) {
    super(message, status, data, true)
    // Payload picks the log level by `name`. Set it here rather than relying on the class name,
    // which the production build may shorten.
    this.name = REFUSAL
  }
}
