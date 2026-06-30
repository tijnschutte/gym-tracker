import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginScreen() {
  const { loading, error } = useAuth()
  const googleButtonRef = useRef<HTMLDivElement>(null)

  // Render the official Google button once GIS is ready. This is the reliable
  // sign-in path on every platform — the One Tap prompt is unavailable on iOS
  // Safari and many mobile/in-app browsers, so we don't surface it here.
  useEffect(() => {
    if (loading || error) return
    if (!googleButtonRef.current) return
    if (!window.google?.accounts?.id) return

    google.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      width: '300',
    })
  }, [loading, error])

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Gym Tracker
          </CardTitle>
          <CardDescription>
            Sign in to start tracking your workouts
          </CardDescription>
        </CardHeader>

        <CardContent className="flex min-h-[64px] flex-col items-center justify-center gap-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {!loading && !error && <div ref={googleButtonRef} />}
        </CardContent>
      </Card>
    </div>
  )
}
