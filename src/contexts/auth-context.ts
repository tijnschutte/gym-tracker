import { createContext } from "react";

export interface UserInfo {
  sub: string;
  email: string;
  name: string;
}

export interface AuthState {
  /** The current user, or null when signed out. */
  user: UserInfo | null;
  /** The raw Google ID token JWT -- attach to API requests. */
  idToken: string | null;
  /** Whether we are still loading the GIS library. */
  loading: boolean;
  /** Non-null when GIS failed to load or the client ID is missing. */
  error: string | null;
  signIn: () => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);
