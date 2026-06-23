import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginScreen } from '@/components/LoginScreen'
import { SessionScreen } from '@/components/SessionScreen'
import { ProgressScreen } from '@/components/ProgressScreen'
import { Toaster } from '@/components/ui/sonner'
import { Dumbbell, TrendingUp } from 'lucide-react'

type View = 'session' | 'progress'

function App() {
  const { user } = useAuth()
  const [view, setView] = useState<View>('session')

  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    )
  }

  return (
    <>
      <div className="flex min-h-svh flex-col pb-16">
        {view === 'progress' ? <ProgressScreen /> : <SessionScreen />}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg">
          <button
            type="button"
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
              view === 'session'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('session')}
          >
            <Dumbbell className="h-5 w-5" />
            Session
          </button>
          <button
            type="button"
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors ${
              view === 'progress'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setView('progress')}
          >
            <TrendingUp className="h-5 w-5" />
            Progress
          </button>
        </div>
      </nav>

      <Toaster />
    </>
  )
}

export default App
