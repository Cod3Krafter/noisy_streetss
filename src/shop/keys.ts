/**
 * True when a key, already trimmed, holds only printable characters with no spaces. A line break or
 * space inside a key breaks the Authorization header, and the resulting error would quote the key.
 */
export const isPrintableKey = (value: string) => /^[\x21-\x7e]+$/.test(value)
