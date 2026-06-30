import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchHistory } from '@/lib/api'
import type { HistoryData } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Loader2, ArrowLeft, TrendingUp, Trophy } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse "DD/MM/YYYY" into a Date object. */
function parseDateString(s: string): Date {
  const [dd, mm, yyyy] = s.split('/')
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd))
}

/** Format a Date as "DD/MM/YY". */
function formatShortDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${yy}`
}

interface DataPoint {
  date: string
  kg: number
}

/** Convert a date→kg record into sorted chart data points. */
function toChartData(dateMap: Record<string, number>): DataPoint[] {
  return Object.entries(dateMap)
    .map(([dateStr, kg]) => ({
      sortKey: parseDateString(dateStr).getTime(),
      date: formatShortDate(parseDateString(dateStr)),
      kg,
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ date, kg }) => ({ date, kg }))
}

const chartConfig = {
  kg: {
    label: 'Weight (kg)',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig

interface PersonalRecord {
  kg: number
  date: string
}

/** Find the heaviest logged weight (and the date it was set) for an exercise. */
function findPersonalRecord(
  dateMap: Record<string, number>,
): PersonalRecord | null {
  const entries = Object.entries(dateMap)
  if (entries.length === 0) return null

  let best = entries[0]
  for (const entry of entries) {
    if (entry[1] > best[1]) best = entry
  }
  return { kg: best[1], date: formatShortDate(parseDateString(best[0])) }
}

// ---------------------------------------------------------------------------
// ProgressScreen
// ---------------------------------------------------------------------------

export function ProgressScreen() {
  const { idToken } = useAuth()

  const [history, setHistory] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null)

  // -- Fetch history on mount -----------------------------------------------
  useEffect(() => {
    if (!idToken) return

    let cancelled = false

    fetchHistory(idToken)
      .then((data) => {
        if (!cancelled) {
          setHistory(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load history',
          )
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [idToken])

  // Only exercises the user has actually logged (non-empty history), excluding
  // predefined exercises that have no recorded data.
  const loggedExercises = history
    ? Object.keys(history)
        .filter((name) => Object.keys(history[name]).length > 0)
        .sort((a, b) => a.localeCompare(b))
    : []

  const handleSelectExercise = useCallback((name: string) => {
    setSelectedExercise(name)
  }, [])

  const handleBackToList = useCallback(() => {
    setSelectedExercise(null)
  }, [])

  // -- Render ---------------------------------------------------------------

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-3">
          {selectedExercise && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBackToList}
              aria-label="Back to exercise list"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-semibold tracking-tight">
            {selectedExercise ?? 'Progress'}
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center px-4 py-6">
        <div className="flex w-full max-w-lg flex-col gap-6">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading progress...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <Card className="w-full">
              <CardContent className="pt-6">
                <p className="text-center text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!loading && !error && history && loggedExercises.length === 0 && (
            <Card className="w-full">
              <CardContent className="pt-6">
                <p className="text-center text-sm text-muted-foreground">
                  No progress yet. Complete your first session to start
                  tracking!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Exercise list view */}
          {!loading &&
            !error &&
            history &&
            loggedExercises.length > 0 &&
            !selectedExercise && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Exercises</CardTitle>
                  <CardDescription>
                    Tap an exercise to view your progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {loggedExercises.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className="flex min-h-[44px] w-full items-center justify-between rounded-md bg-muted px-3 py-2 text-left transition-colors hover:bg-muted/80 active:bg-muted/60"
                          onClick={() => handleSelectExercise(name)}
                        >
                          <span className="text-sm font-medium">{name}</span>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Chart view */}
          {!loading && !error && history && selectedExercise && (
            <ExerciseChart
              exercise={selectedExercise}
              dateMap={history[selectedExercise] ?? {}}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExerciseChart
// ---------------------------------------------------------------------------

function ExerciseChart({
  exercise,
  dateMap,
}: {
  exercise: string
  dateMap: Record<string, number>
}) {
  const data = toChartData(dateMap)
  const pr = findPersonalRecord(dateMap)

  if (data.length < 2) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{exercise}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {pr && <PersonalRecordBadge pr={pr} />}
          <p className="text-center text-sm text-muted-foreground">
            Need at least 2 data points to chart progress
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{exercise}</CardTitle>
        <CardDescription>Weight over time</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {pr && <PersonalRecordBadge pr={pr} />}
        <ChartContainer config={chartConfig}>
          <LineChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              unit=" kg"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Date: ${value}`}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="kg"
              stroke="var(--color-kg)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// PersonalRecordBadge
// ---------------------------------------------------------------------------

function PersonalRecordBadge({ pr }: { pr: PersonalRecord }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2.5">
      <Trophy className="h-5 w-5 shrink-0 text-amber-500" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground">
          Personal record
        </span>
        <span className="text-sm font-semibold">
          {pr.kg} kg
          <span className="ml-1.5 font-normal text-muted-foreground">
            on {pr.date}
          </span>
        </span>
      </div>
    </div>
  )
}
