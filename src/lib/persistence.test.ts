import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession, loadSession, clearSession } from './persistence'
import type { Session } from './session'

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------
const store: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key]
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) {
      delete store[key]
    }
  }),
  get length() {
    return Object.keys(store).length
  },
  key: vi.fn(() => null as string | null),
}

beforeEach(() => {
  vi.stubGlobal('localStorage', localStorageMock)
})

afterEach(() => {
  // Clear mock store
  for (const key of Object.keys(store)) {
    delete store[key]
  }
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'test-uuid-1234',
    entries: [],
    startedAt: '2026-06-22T10:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// saveSession
// ---------------------------------------------------------------------------
describe('saveSession', () => {
  it('writes session JSON to localStorage', () => {
    const session = makeSession({ entries: [{ exercise: 'Squat', kg: 100 }] })
    saveSession(session)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'gym-tracker-session',
      JSON.stringify(session),
    )
  })

  it('does not throw when localStorage.setItem throws', () => {
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceeded')
    })
    expect(() => saveSession(makeSession())).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// loadSession
// ---------------------------------------------------------------------------
describe('loadSession', () => {
  it('returns null when no session is stored', () => {
    expect(loadSession()).toBeNull()
  })

  it('returns a valid session when one is stored', () => {
    const session = makeSession({ entries: [{ exercise: 'Squat', kg: 100 }] })
    store['gym-tracker-session'] = JSON.stringify(session)
    const loaded = loadSession()
    expect(loaded).toEqual(session)
  })

  it('returns null for corrupt JSON', () => {
    store['gym-tracker-session'] = 'not-valid-json{{{'
    expect(loadSession()).toBeNull()
  })

  it('returns null for valid JSON that is not a session', () => {
    store['gym-tracker-session'] = JSON.stringify({ foo: 'bar' })
    expect(loadSession()).toBeNull()
  })

  it('returns null for session with missing entries', () => {
    store['gym-tracker-session'] = JSON.stringify({
      id: 'abc',
      startedAt: '2026-01-01',
    })
    expect(loadSession()).toBeNull()
  })

  it('returns null for session with invalid entry shape', () => {
    store['gym-tracker-session'] = JSON.stringify({
      id: 'abc',
      entries: [{ exercise: 123, kg: 'not-a-number' }],
      startedAt: '2026-01-01',
    })
    expect(loadSession()).toBeNull()
  })

  it('returns null for session where entries is not an array', () => {
    store['gym-tracker-session'] = JSON.stringify({
      id: 'abc',
      entries: 'not-an-array',
      startedAt: '2026-01-01',
    })
    expect(loadSession()).toBeNull()
  })

  it('returns null for null stored value', () => {
    store['gym-tracker-session'] = 'null'
    expect(loadSession()).toBeNull()
  })

  it('handles resume detection — stored session is loadable', () => {
    const session = makeSession({
      entries: [
        { exercise: 'Bench Press', kg: 80 },
        { exercise: 'Squat', kg: 100 },
      ],
    })
    store['gym-tracker-session'] = JSON.stringify(session)
    const loaded = loadSession()
    expect(loaded).not.toBeNull()
    expect(loaded!.entries).toHaveLength(2)
    expect(loaded!.id).toBe('test-uuid-1234')
  })
})

// ---------------------------------------------------------------------------
// clearSession
// ---------------------------------------------------------------------------
describe('clearSession', () => {
  it('removes the session key from localStorage', () => {
    store['gym-tracker-session'] = JSON.stringify(makeSession())
    clearSession()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(
      'gym-tracker-session',
    )
  })

  it('does not throw when localStorage.removeItem throws', () => {
    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error('SecurityError')
    })
    expect(() => clearSession()).not.toThrow()
  })
})
