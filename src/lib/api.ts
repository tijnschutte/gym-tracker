// =============================================================================
// API client — communicates with the Google Apps Script Web App backend
// =============================================================================

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as
  | string
  | undefined

// ---- Types ------------------------------------------------------------------

export interface SaveSessionData {
  sessionId: string
  exercises: {
    name: string
    kg: number
    notes?: string
  }[]
}

// ---- Helpers ----------------------------------------------------------------

/**
 * POST JSON to the Apps Script backend and return the parsed response.
 * Throws on network errors or when the response body contains an `error` field.
 */
async function postAction<T>(
  action: string,
  idToken: string,
  extra: Record<string, unknown> = {},
): Promise<T> {
  if (!APPS_SCRIPT_URL) {
    throw new Error(
      'Missing VITE_APPS_SCRIPT_URL. Add it to your .env.local file.',
    )
  }

  // Apps Script returns a 302 redirect to googleusercontent.com.
  // The browser follows it automatically, but the redirected response is opaque
  // under certain CORS conditions. Using "no-cors" + "follow" won't give us the
  // body. Instead, we follow the redirect manually.
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, idToken, ...extra }),
    redirect: 'follow',
  })

  // If we got redirected and the response isn't ok, or if it's opaque, try again
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`)
  }

  const text = await res.text()
  let data: T & { error?: string }
  try {
    data = JSON.parse(text) as T & { error?: string }
  } catch {
    throw new Error(`Invalid JSON response from server: ${text.slice(0, 200)}`)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data
}

// ---- Public API -------------------------------------------------------------

/**
 * Fetch the list of exercises the current user has previously logged.
 *
 * @param idToken - Google ID token JWT from the auth context.
 * @returns An array of exercise name strings.
 */
export async function fetchExercises(idToken: string): Promise<string[]> {
  const data = await postAction<{ exercises: string[] }>(
    'getExercises',
    idToken,
  )
  return data.exercises
}

/**
 * Save a workout session to the backend.
 *
 * @param idToken - Google ID token JWT from the auth context.
 * @param data    - The session payload to persist.
 */
export async function saveSession(
  idToken: string,
  data: SaveSessionData,
): Promise<void> {
  await postAction<{ success: boolean }>('save', idToken, { data })
}
