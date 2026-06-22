// =============================================================================
// Persistence Module — localStorage wrapper for session data
// =============================================================================

import type { Session } from './session'

const STORAGE_KEY = 'gym-tracker-session'

/**
 * Save the current session to localStorage.
 */
export function saveSession(session: Session): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Silently fail — quota exceeded, private browsing, etc.
    console.warn('[persistence] Failed to save session to localStorage')
  }
}

/**
 * Load a session from localStorage.
 * Returns null if not found, or if the data is corrupt / invalid.
 */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)

    // Validate shape
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('id' in parsed) ||
      !('entries' in parsed) ||
      !('startedAt' in parsed)
    ) {
      return null
    }

    const session = parsed as Record<string, unknown>

    if (
      typeof session.id !== 'string' ||
      typeof session.startedAt !== 'string'
    ) {
      return null
    }

    if (!Array.isArray(session.entries)) {
      return null
    }

    // Validate each entry
    for (const entry of session.entries) {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        typeof entry.exercise !== 'string' ||
        typeof entry.kg !== 'number'
      ) {
        return null
      }
    }

    return session as unknown as Session
  } catch {
    // JSON.parse failure or other error
    return null
  }
}

/**
 * Clear the saved session from localStorage.
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Silently fail
    console.warn('[persistence] Failed to clear session from localStorage')
  }
}
