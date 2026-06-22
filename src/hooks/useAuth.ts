import { useContext } from 'react'
import { AuthContext, type AuthState } from '@/contexts/auth-context'

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}
