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
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Welcome, {user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
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
              <div className="text-center">
                {exercises.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No exercises yet. Start your first session!
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Your exercises ({exercises.length}):
                    </p>
                    <ul className="space-y-1">
                      {exercises.map((exercise) => (
                        <li
                          key={exercise}
                          className="rounded-md bg-muted px-3 py-2 text-sm"
                        >
                          {exercise}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
