// =============================================================================
// Session Module — pure logic, no React dependencies
// =============================================================================

// ---- Types ------------------------------------------------------------------

export interface SessionEntry {
  exercise: string
  kg: number
}

export interface Session {
  id: string
  entries: SessionEntry[]
  startedAt: string
}

// ---- Functions --------------------------------------------------------------

/**
 * Round a kg value to one decimal place. The backend cannot store arbitrary
 * floats, and one decimal of precision is enough for weights.
 */
export function roundKg(kg: number): number {
  return Math.round(kg * 10) / 10
}

/**
 * Create a new empty session with a unique ID and the current timestamp.
 */
export function createSession(): Session {
  return {
    id: crypto.randomUUID(),
    entries: [],
    startedAt: new Date().toISOString(),
  }
}

/**
 * Add an entry to the session. If an entry with the same exercise name already
 * exists (case-insensitive), it is overwritten with the new value.
 * Returns a new session object (immutable).
 */
export function addEntry(session: Session, entry: SessionEntry): Session {
  const key = entry.exercise.toLowerCase()
  const exists = session.entries.some((e) => e.exercise.toLowerCase() === key)

  const entries = exists
    ? session.entries.map((e) =>
        e.exercise.toLowerCase() === key ? { ...entry } : e,
      )
    : [...session.entries, { ...entry }]

  return { ...session, entries }
}

/**
 * Update the kg value for an existing exercise entry.
 * Returns a new session object (immutable).
 */
export function updateEntry(
  session: Session,
  exercise: string,
  kg: number,
): Session {
  const key = exercise.toLowerCase()
  return {
    ...session,
    entries: session.entries.map((e) =>
      e.exercise.toLowerCase() === key ? { ...e, kg } : e,
    ),
  }
}

/**
 * Remove an entry by exercise name (case-insensitive).
 * Returns a new session object (immutable).
 */
export function removeEntry(session: Session, exercise: string): Session {
  const key = exercise.toLowerCase()
  return {
    ...session,
    entries: session.entries.filter((e) => e.exercise.toLowerCase() !== key),
  }
}
