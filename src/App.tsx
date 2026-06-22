import { useAuth } from '@/hooks/useAuth'
import { LoginScreen } from '@/components/LoginScreen'
import { SessionScreen } from '@/components/SessionScreen'
import { Toaster } from '@/components/ui/sonner'

function App() {
  const { user } = useAuth()

  return (
    <>
      {user ? <SessionScreen /> : <LoginScreen />}
      <Toaster />
    </>
  )
}

export default App
