const filled = (value: unknown) => typeof value === 'string' && value.trim() !== ''

/** A published episode needs somewhere to listen. Returns the message to show, or null when fine. */
export function listenLinkProblem(spotifyUrl: unknown, youtubeUrl: unknown): string | null {
  return filled(spotifyUrl) || filled(youtubeUrl) ? null : 'Add a Spotify or YouTube link before publishing.'
}
