import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function LoginScreen() {
  const { loading, error, signIn } = useAuth()
  const googleButtonRef = useRef<HTMLDivElement>(null)

  // Render the official Google button once GIS is ready.
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

        <CardContent className="flex flex-col items-center gap-4">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-destructive text-center">{error}</p>
              {/* Fallback button in case renderButton can't work */}
              <Button
                variant="outline"
                size="lg"
                className="w-full max-w-[300px]"
                onClick={signIn}
                disabled
              >
                Sign in with Google
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Google-rendered button */}
              <div ref={googleButtonRef} />

              {/* Fallback: manual trigger via One Tap prompt */}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={signIn}
              >
                Use One Tap sign-in instead
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
