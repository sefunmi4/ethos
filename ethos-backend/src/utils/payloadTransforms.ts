export interface LegacyUserPayload {
  username?: string;
  handle?: string;
  bio?: string;
  about?: string;
}

/**
 * Normalizes incoming user payloads by accepting both legacy and new
 * field names and returning a consistent shape for persistence.
 */
export function normalizeUserPayload(payload: LegacyUserPayload): {
  username?: string;
  bio?: string;
} {
  const username = payload.username ?? payload.handle;
  const bio = payload.bio ?? payload.about;
  return { username, bio };
}
