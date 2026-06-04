import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  clearSession,
  fetchCurrentUser,
  login as loginRequest,
  persistSession,
  readSession,
} from "../api";
import type { AuthSession, PublicUser } from "../types";

type AuthContextValue = {
  user: PublicUser | null;
  token: string | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() =>
    readSession(),
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function hydrate() {
      const stored = readSession();
      if (!stored) {
        if (alive) {
          setSession(null);
          setIsReady(true);
        }
        return;
      }

      try {
        const { user } = await fetchCurrentUser();
        if (alive) {
          const nextSession = { token: stored.token, user };
          setSession(nextSession);
          persistSession(nextSession);
          setIsReady(true);
        }
      } catch (error) {
        if (!alive) return;
        const isAuthFailure =
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403);
        if (isAuthFailure) {
          setSession(null);
          clearSession();
        } else {
          setSession(stored);
        }
        setIsReady(true);
      }
    }

    void hydrate();

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isReady,
      login: async (username, password) => {
        const nextSession = await loginRequest(username, password);
        setSession(nextSession);
        persistSession(nextSession);
      },
      logout: () => {
        setSession(null);
        clearSession();
      },
      refreshUser: async () => {
        const stored = readSession();
        if (!stored) {
          setSession(null);
          return;
        }

        const { user } = await fetchCurrentUser();
        const nextSession = { token: stored.token, user };
        setSession(nextSession);
        persistSession(nextSession);
      },
      can: (permission) =>
        Boolean(session?.user?.permissions?.includes(permission)),
    }),
    [isReady, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
