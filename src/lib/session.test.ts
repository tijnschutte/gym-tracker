import { describe, expect, it } from 'vitest'
import {
  createSession,
  addEntry,
  updateEntry,
  removeEntry,
  roundKg,
} from './session'
import type { SessionEntry } from './session'

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------
describe('createSession', () => {
  it('returns a session with a UUID id', () => {
    const session = createSession()
    // UUID v4 format: 8-4-4-4-12 hex chars
    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('returns empty entries array', () => {
    const session = createSession()
    expect(session.entries).toEqual([])
  })

  it('returns a valid ISO timestamp for startedAt', () => {
    const before = new Date().toISOString()
    const session = createSession()
    const after = new Date().toISOString()
    expect(session.startedAt >= before).toBe(true)
    expect(session.startedAt <= after).toBe(true)
  })

  it('generates unique IDs across calls', () => {
    const a = createSession()
    const b = createSession()
    expect(a.id).not.toBe(b.id)
  })
})

// ---------------------------------------------------------------------------
// addEntry
// ---------------------------------------------------------------------------
describe('addEntry', () => {
  it('adds an entry to an empty session', () => {
    const session = createSession()
    const entry: SessionEntry = { exercise: 'Bench Press', kg: 80 }
    const updated = addEntry(session, entry)
    expect(updated.entries).toHaveLength(1)
    expect(updated.entries[0]).toEqual(entry)
  })

  it('appends entries for different exercises', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Bench Press', kg: 80 })
    session = addEntry(session, { exercise: 'Squat', kg: 100 })
    expect(session.entries).toHaveLength(2)
    expect(session.entries[0].exercise).toBe('Bench Press')
    expect(session.entries[1].exercise).toBe('Squat')
  })

  it('overwrites entry with same exercise name (case-insensitive)', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Bench Press', kg: 80 })
    session = addEntry(session, { exercise: 'bench press', kg: 85 })
    expect(session.entries).toHaveLength(1)
    // The exercise name from the latest entry wins
    expect(session.entries[0].exercise).toBe('bench press')
    expect(session.entries[0].kg).toBe(85)
  })

  it('returns a new session object (immutability)', () => {
    const original = createSession()
    const updated = addEntry(original, { exercise: 'Squat', kg: 100 })
    expect(updated).not.toBe(original)
    expect(original.entries).toHaveLength(0)
    expect(updated.entries).toHaveLength(1)
  })

  it('preserves session id and startedAt', () => {
    const session = createSession()
    const updated = addEntry(session, { exercise: 'Deadlift', kg: 120 })
    expect(updated.id).toBe(session.id)
    expect(updated.startedAt).toBe(session.startedAt)
  })
})

// ---------------------------------------------------------------------------
// updateEntry
// ---------------------------------------------------------------------------
describe('updateEntry', () => {
  it('updates the kg of an existing entry', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Bench Press', kg: 80 })
    const updated = updateEntry(session, 'Bench Press', 90)
    expect(updated.entries).toHaveLength(1)
    expect(updated.entries[0].kg).toBe(90)
    expect(updated.entries[0].exercise).toBe('Bench Press')
  })

  it('matches exercise name case-insensitively', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Bench Press', kg: 80 })
    const updated = updateEntry(session, 'bench press', 90)
    expect(updated.entries[0].kg).toBe(90)
  })

  it("does not modify entries that don't match", () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Bench Press', kg: 80 })
    session = addEntry(session, { exercise: 'Squat', kg: 100 })
    const updated = updateEntry(session, 'Bench Press', 90)
    expect(updated.entries).toHaveLength(2)
    expect(updated.entries[0].kg).toBe(90)
    expect(updated.entries[1].kg).toBe(100)
  })

  it('returns a new session object (immutability)', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Squat', kg: 100 })
    const updated = updateEntry(session, 'Squat', 110)
    expect(updated).not.toBe(session)
  })
})

// ---------------------------------------------------------------------------
// removeEntry
// ---------------------------------------------------------------------------
describe('removeEntry', () => {
  it('removes an entry by exercise name', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Bench Press', kg: 80 })
    session = addEntry(session, { exercise: 'Squat', kg: 100 })
    const updated = removeEntry(session, 'Bench Press')
    expect(updated.entries).toHaveLength(1)
    expect(updated.entries[0].exercise).toBe('Squat')
  })

  it('matches exercise name case-insensitively', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Bench Press', kg: 80 })
    const updated = removeEntry(session, 'bench press')
    expect(updated.entries).toHaveLength(0)
  })

  it('does nothing if exercise not found', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Squat', kg: 100 })
    const updated = removeEntry(session, 'Nonexistent')
    expect(updated.entries).toHaveLength(1)
    expect(updated.entries[0].exercise).toBe('Squat')
  })

  it('returns a new session object (immutability)', () => {
    let session = createSession()
    session = addEntry(session, { exercise: 'Squat', kg: 100 })
    const updated = removeEntry(session, 'Squat')
    expect(updated).not.toBe(session)
    expect(session.entries).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// roundKg
// ---------------------------------------------------------------------------
describe('roundKg', () => {
  it('rounds to one decimal place', () => {
    expect(roundKg(20.25)).toBe(20.3)
    expect(roundKg(20.24)).toBe(20.2)
    expect(roundKg(80.05)).toBe(80.1)
  })

  it('leaves values with one or zero decimals unchanged', () => {
    expect(roundKg(80)).toBe(80)
    expect(roundKg(82.5)).toBe(82.5)
  })
})
