// =============================================================================
// API client — communicates with the Google Apps Script Web App backend
// =============================================================================

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as
  | string
  | undefined;

// ---- Types ------------------------------------------------------------------

export interface SaveSessionData {
  sessionId: string;
  exercises: {
    name: string;
    kg: number;
    notes?: string;
  }[];
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
      "Missing VITE_APPS_SCRIPT_URL. Add it to your .env.local file.",
    );
  }

  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    // Apps Script deployed web apps redirect 302 on POST with JSON content-type.
    // Using "text/plain" avoids a CORS preflight and the body is still valid JSON.
    body: JSON.stringify({ action, idToken, ...extra }),
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as T & { error?: string };

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
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
    "getExercises",
    idToken,
  );
  return data.exercises;
}

/**
 * Save a workout session to the backend.
 * (Stub — the Apps Script handler will be implemented in issue #7.)
 *
 * @param idToken - Google ID token JWT from the auth context.
 * @param data    - The session payload to persist.
 */
export async function saveSession(
  idToken: string,
  data: SaveSessionData,
): Promise<void> {
  await postAction<{ success: boolean }>("save", idToken, { data });
}
