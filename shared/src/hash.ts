import { createHash } from 'node:crypto';

// Backend-only (uses node:crypto). Exposed via the `@muse/shared/hash` subpath so browser
// consumers of `@muse/shared` never pull in Node built-ins.

/** Stable identifier for an image candidate: the SHA-256 hex digest of its URL. */
export function imageId(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}
