import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchExercises, saveSession as apiSaveSession } from '@/lib/api'
import {
  createSession,
  addEntry,
  updateEntry,
  removeEntry,
} from '@/lib/session'
import type { Session, SessionEntry } from '@/lib/session'
import { saveSession, loadSession, clearSession } from '@/lib/persistence'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ExerciseLogger } from '@/components/ExerciseLogger'
import type { ExerciseEntry } from '@/components/ExerciseLogger'
import { X, Pencil, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type View = 'logging' | 'summary'

// ---------------------------------------------------------------------------
// Resume Dialog
// ---------------------------------------------------------------------------

function ResumeDialog({
  onResume,
  onDiscard,
}: {
  onResume: () => void
  onDiscard: () => void
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume Session?</CardTitle>
        <CardDescription>
          You have an unfinished session. Would you like to continue where you
          left off?
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button className="flex-1" onClick={onResume}>
          Resume
        </Button>
        <Button className="flex-1" variant="outline" onClick={onDiscard}>
          Start Fresh
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Session Entry Row (with inline edit + delete)
// ---------------------------------------------------------------------------

function SessionEntryRow({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: SessionEntry
  onUpdate: (exercise: string, kg: number) => void
  onRemove: (exercise: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(entry.kg))
  const inputRef = useRef<HTMLInputElement>(null)

  const handleStartEdit = useCallback(() => {
    setEditValue(String(entry.kg))
    setEditing(true)
  }, [entry.kg])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const handleConfirm = useCallback(() => {
    const parsed = parseFloat(editValue)
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdate(entry.exercise, parsed)
    }
    setEditing(false)
  }, [editValue, entry.exercise, onUpdate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleConfirm()
      if (e.key === 'Escape') setEditing(false)
    },
    [handleConfirm],
  )

  return (
    <li className="flex min-h-[44px] items-center justify-between gap-2 rounded-md bg-muted px-3 py-2">
      <span className="text-sm font-medium">{entry.exercise}</span>

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Input
              ref={inputRef}
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              className="h-8 w-20 text-right text-sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleConfirm}
            />
            <span className="text-sm text-muted-foreground">kg</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleConfirm}
              aria-label="Confirm edit"
            >
              <Check className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">{entry.kg} kg</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleStartEdit}
              aria-label={`Edit ${entry.exercise}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(entry.exercise)}
          aria-label={`Remove ${entry.exercise}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// SessionScreen
// ---------------------------------------------------------------------------

export function SessionScreen() {
  const { user, idToken, signOut } = useAuth()
  const [exercisesResult, setExercisesResult] = useState<
    | { status: 'loading' }
    | { status: 'success'; data: string[] }
    | { status: 'error'; message: string }
  >({ status: 'loading' })

  const [session, setSession] = useState<Session | null>(null)
  const [pendingResume, setPendingResume] = useState<Session | null>(null)
  const [view, setView] = useState<View>('logging')
  const [saving, setSaving] = useState(false)

  // -- Initialise session (check for resume) --------------------------------
  const [initialized, setInitialized] = useState(false)
  if (!initialized) {
    setInitialized(true)
    const saved = loadSession()
    if (saved && saved.entries.length > 0) {
      setPendingResume(saved)
    } else {
      setSession(createSession())
    }
  }

  // -- Persist session on every change --------------------------------------
  useEffect(() => {
    if (session) {
      saveSession(session)
    }
  }, [session])

  // -- Load exercises from API ----------------------------------------------
  const [exercisesFetchKey, setExercisesFetchKey] = useState(0)

  useEffect(() => {
    if (!idToken) return

    let cancelled = false

    fetchExercises(idToken)
      .then((result) => {
        if (!cancelled) setExercisesResult({ status: 'success', data: result })
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load exercises'
          setExercisesResult({ status: 'error', message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [idToken, exercisesFetchKey])

  const retryLoadExercises = useCallback(() => {
    setExercisesResult({ status: 'loading' })
    setExercisesFetchKey((k) => k + 1)
  }, [])

  // -- Session actions ------------------------------------------------------

  const handleResume = useCallback(() => {
    if (pendingResume) {
      setSession(pendingResume)
      setPendingResume(null)
    }
  }, [pendingResume])

  const handleDiscard = useCallback(() => {
    clearSession()
    setPendingResume(null)
    setSession(createSession())
  }, [])

  const handleAddEntry = useCallback(
    (entry: ExerciseEntry) => {
      if (!session) return
      setSession((prev) => (prev ? addEntry(prev, entry) : prev))
    },
    [session],
  )

  const handleUpdateEntry = useCallback(
    (exercise: string, kg: number) => {
      if (!session) return
      setSession((prev) => (prev ? updateEntry(prev, exercise, kg) : prev))
    },
    [session],
  )

  const handleRemoveEntry = useCallback(
    (exercise: string) => {
      if (!session) return
      setSession((prev) => (prev ? removeEntry(prev, exercise) : prev))
    },
    [session],
  )

  const handleFinish = useCallback(() => {
    setView('summary')
  }, [])

  const handleBackToLogging = useCallback(() => {
    setView('logging')
  }, [])

  const handleSave = useCallback(async () => {
    if (!session || !idToken) return
    setSaving(true)
    try {
      await apiSaveSession(idToken, {
        sessionId: session.id,
        exercises: session.entries.map((e) => ({ name: e.exercise, kg: e.kg })),
      })
      clearSession()
      setSession(createSession())
      setView('logging')
      toast.success('Session saved!')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save session'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }, [session, idToken])

  if (!user) return null

  // -- Render ---------------------------------------------------------------

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">Gym Tracker</h1>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <div className="flex w-full max-w-lg flex-col gap-6">
          {/* Resume prompt */}
          {pendingResume && (
            <ResumeDialog onResume={handleResume} onDiscard={handleDiscard} />
          )}

          {/* Session active */}
          {session && view === 'logging' && (
            <>
              {/* Exercise Logger */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Log Exercise</CardTitle>
                  <CardDescription>
                    Add an exercise to your session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {exercisesResult.status === 'loading' && (
                    <p className="text-center text-sm text-muted-foreground">
                      Loading exercises...
                    </p>
                  )}

                  {exercisesResult.status === 'error' && (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-center text-sm text-destructive">
                        {exercisesResult.message}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryLoadExercises}
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {exercisesResult.status === 'success' && (
                    <ExerciseLogger
                      userExercises={exercisesResult.data}
                      onAdd={handleAddEntry}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Session entries list */}
              {session.entries.length > 0 && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>
                      Session ({session.entries.length}{' '}
                      {session.entries.length === 1 ? 'entry' : 'entries'})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {session.entries.map((entry) => (
                        <SessionEntryRow
                          key={entry.exercise}
                          entry={entry}
                          onUpdate={handleUpdateEntry}
                          onRemove={handleRemoveEntry}
                        />
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Finish session button */}
              {session.entries.length > 0 && (
                <Button className="w-full" size="lg" onClick={handleFinish}>
                  Finish Session
                </Button>
              )}
            </>
          )}

          {/* Summary view */}
          {session && view === 'summary' && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
                <CardDescription>
                  Review your session before saving
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {session.entries.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No exercises logged.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {session.entries.map((entry) => (
                      <li
                        key={entry.exercise}
                        className="flex min-h-[44px] items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{entry.exercise}</span>
                        <span className="text-muted-foreground">
                          {entry.kg} kg
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleBackToLogging}
                    disabled={saving}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={session.entries.length === 0 || saving}
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
