import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchExercises } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  ExerciseLogger,
  type ExerciseEntry,
} from "@/components/ExerciseLogger";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function SessionScreen() {
  const { user, idToken, signOut } = useAuth();
  const [exercises, setExercises] = useState<string[]>([]);
  const [exercisesLoading, setExercisesLoading] = useState(true);
  const [exercisesError, setExercisesError] = useState<string | null>(null);
  const [sessionEntries, setSessionEntries] = useState<ExerciseEntry[]>([]);

  const loadExercises = useCallback(async () => {
    if (!idToken) return;

    setExercisesLoading(true);
    setExercisesError(null);

    try {
      const result = await fetchExercises(idToken);
      setExercises(result);
      console.log("[SessionScreen] Exercises loaded:", result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load exercises";
      setExercisesError(message);
      console.error("[SessionScreen] Error loading exercises:", message);
    } finally {
      setExercisesLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    void loadExercises();
  }, [loadExercises]);

  const handleAddEntry = useCallback((entry: ExerciseEntry) => {
    console.log("[SessionScreen] Added entry:", entry);
    setSessionEntries((prev) => [...prev, entry]);
  }, []);

  if (!user) return null;

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">
            Gym Tracker
          </h1>
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
          {/* Exercise Logger */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Log Exercise</CardTitle>
              <CardDescription>Add an exercise to your session</CardDescription>
            </CardHeader>
            <CardContent>
              {exercisesLoading && (
                <p className="text-center text-sm text-muted-foreground">
                  Loading exercises...
                </p>
              )}

              {exercisesError && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-center text-sm text-destructive">
                    {exercisesError}
                  </p>
                  <Button variant="outline" size="sm" onClick={loadExercises}>
                    Retry
                  </Button>
                </div>
              )}

              {!exercisesLoading && !exercisesError && (
                <ExerciseLogger
                  userExercises={exercises}
                  onAdd={handleAddEntry}
                />
              )}
            </CardContent>
          </Card>

          {/* Session entries list */}
          {sessionEntries.length > 0 && (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  Session ({sessionEntries.length}{" "}
                  {sessionEntries.length === 1 ? "entry" : "entries"})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {sessionEntries.map((entry, i) => (
                    <li
                      key={`${entry.exercise}-${i}`}
                      className="flex items-baseline justify-between rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{entry.exercise}</span>
                      <span className="text-muted-foreground">
                        {entry.kg} kg
                        {entry.notes ? ` — ${entry.notes}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
