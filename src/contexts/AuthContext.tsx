import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AuthContext, type UserInfo } from './auth-context'
import { clearSession } from '@/lib/persistence'

// ---- Helpers ---------------------------------------------------------------

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined

/**
 * Decode the payload of a JWT without verifying the signature.
 * This is safe here because we only use it client-side to display the user's
 * name/email; the back-end should verify the token independently.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )
  return JSON.parse(json) as Record<string, unknown>
}

/** Dynamically load the GIS script if it isn't already present. */
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Google Identity Services script')),
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity Services script'))
    document.head.appendChild(script)
  })
}

// ---- localStorage persistence ----------------------------------------------

const AUTH_STORAGE_KEY = 'gym-tracker-auth'

interface StoredAuth {
  user: UserInfo
  idToken: string
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (!parsed.user?.sub || !parsed.idToken) return null
    // Check token expiry — discard if expired
    const payload = decodeJwtPayload(parsed.idToken)
    const exp = (payload.exp as number) * 1000
    if (Date.now() >= exp) return null
    return parsed
  } catch {
    return null
  }
}

function storeAuth(user: UserInfo, idToken: string): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, idToken }))
  } catch {
    // quota exceeded, private browsing, etc.
  }
}

function clearStoredAuth(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // ignore
  }
}

// ---- Provider --------------------------------------------------------------

const missingClientId = !GOOGLE_CLIENT_ID
const restoredAuth = missingClientId ? null : loadStoredAuth()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(restoredAuth?.user ?? null)
  const [idToken, setIdToken] = useState<string | null>(
    restoredAuth?.idToken ?? null,
  )
  const [loading, setLoading] = useState(!missingClientId && !restoredAuth)
  const [error, setError] = useState<string | null>(
    missingClientId
      ? 'Missing VITE_GOOGLE_CLIENT_ID. Add it to your .env.local file.'
      : null,
  )
  // Resolvers for in-flight refreshToken() calls, fulfilled when GIS delivers
  // the next credential (or rejected with null on timeout).
  const pendingRefreshRef = useRef<((token: string | null) => void)[]>([])

  // Callback that GIS invokes after a successful sign-in.
  const handleCredentialResponse = useCallback(
    (response: google.accounts.id.CredentialResponse) => {
      try {
        const payload = decodeJwtPayload(response.credential)
        const newUser: UserInfo = {
          sub: payload.sub as string,
          email: payload.email as string,
          name: (payload.name as string) ?? (payload.email as string),
        }
        setUser(newUser)
        setIdToken(response.credential)
        storeAuth(newUser, response.credential)
        setError(null)
      } catch {
        setError('Failed to decode Google credential')
      }

      // Fulfil any pending refreshToken() callers with the fresh token.
      const waiters = pendingRefreshRef.current
      pendingRefreshRef.current = []
      waiters.forEach((resolve) => resolve(response.credential))
    },
    [],
  )

  // Ask Google for a fresh token. Resolves with the new token, or null if no
  // token arrives within 3s (prompt dismissed / cooldown / needs interaction).
  const refreshToken = useCallback((): Promise<string | null> => {
    if (!window.google?.accounts?.id) return Promise.resolve(null)

    return new Promise((resolve) => {
      let settled = false
      const settle = (token: string | null) => {
        if (settled) return
        settled = true
        // Drop our resolver so a late credential doesn't re-trigger it.
        pendingRefreshRef.current = pendingRefreshRef.current.filter(
          (r) => r !== settle,
        )
        resolve(token)
      }

      pendingRefreshRef.current.push(settle)
      google.accounts.id.prompt()
      setTimeout(() => settle(null), 3000)
    })
  }, [])

  // Load GIS + initialize on mount.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    loadGisScript()
      .then(() => {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true,
          use_fedcm_for_prompt: true,
        })
        // Trigger One Tap prompt — auto_select will silently sign in
        // if there's an existing session, avoiding a login redirect.
        google.accounts.id.prompt()
        setLoading(false)
      })
      .catch(() => {
        setError(
          'Could not load Google Identity Services. Check your network or content-security policy.',
        )
        setLoading(false)
      })
  }, [handleCredentialResponse])

  // --- Sign-in: render the One Tap prompt -----------------------------------
  const signIn = useCallback(() => {
    if (!window.google?.accounts?.id) return
    google.accounts.id.prompt()
  }, [])

  // --- Sign-out: clear local state ------------------------------------------
  const signOut = useCallback(() => {
    if (user && window.google?.accounts?.id) {
      google.accounts.id.disableAutoSelect()
    }
    setUser(null)
    setIdToken(null)
    clearStoredAuth()
    // Also drop any in-progress session so it can't leak to the next account
    // that signs in on this device.
    clearSession()
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, idToken, loading, error, signIn, signOut, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}
