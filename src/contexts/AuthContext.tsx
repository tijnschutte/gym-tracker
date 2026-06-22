import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AuthContext, type UserInfo } from "./auth-context";

// ---- Helpers ---------------------------------------------------------------

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as
  | string
  | undefined;

/**
 * Decode the payload of a JWT without verifying the signature.
 * This is safe here because we only use it client-side to display the user's
 * name/email; the back-end should verify the token independently.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );
  return JSON.parse(json) as Record<string, unknown>;
}

/** Dynamically load the GIS script if it isn't already present. */
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google Identity Services script")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });
}

// ---- Provider --------------------------------------------------------------

/** Derive initial loading & error state so the effect never sets state synchronously. */
const missingClientId = !GOOGLE_CLIENT_ID;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(!missingClientId);
  const [error, setError] = useState<string | null>(
    missingClientId
      ? "Missing VITE_GOOGLE_CLIENT_ID. Add it to your .env.local file."
      : null,
  );
  // Callback that GIS invokes after a successful sign-in.
  const handleCredentialResponse = useCallback(
    (response: google.accounts.id.CredentialResponse) => {
      try {
        const payload = decodeJwtPayload(response.credential);
        setUser({
          sub: payload.sub as string,
          email: payload.email as string,
          name: (payload.name as string) ?? (payload.email as string),
        });
        setIdToken(response.credential);
        setError(null);
      } catch {
        setError("Failed to decode Google credential");
      }
    },
    [],
  );

  // Load GIS + initialize on mount.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    loadGisScript()
      .then(() => {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true,
          use_fedcm_for_prompt: true,
        });
        setLoading(false);
      })
      .catch(() => {
        setError(
          "Could not load Google Identity Services. Check your network or content-security policy.",
        );
        setLoading(false);
      });
  }, [handleCredentialResponse]);

  // --- Sign-in: render the One Tap prompt -----------------------------------
  const signIn = useCallback(() => {
    if (!window.google?.accounts?.id) return;
    google.accounts.id.prompt();
  }, []);

  // --- Sign-out: clear local state ------------------------------------------
  const signOut = useCallback(() => {
    if (user && window.google?.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    setIdToken(null);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, idToken, loading, error, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
