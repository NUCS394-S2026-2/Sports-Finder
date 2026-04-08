import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { auth } from '../lib/firebase';

export interface AuthUser {
  email: string;
  displayName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthReady: boolean;
  signIn: (email: string, password: string, mode?: 'signin' | 'signup') => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function displayNameFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'Player';
  const cleaned = local.replace(/[._]/g, ' ').trim();
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  /** @internal tests */
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setIsAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setIsAuthReady(true);
        return;
      }
      setUser({
        email: fbUser.email ?? '',
        displayName: fbUser.displayName || displayNameFromEmail(fbUser.email ?? 'player'),
      });
      setIsAuthReady(true);
    });
    return () => unsub();
  }, [initialUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthReady,
      signIn: async (email: string, password: string, mode = 'signin') => {
        const trimmed = email.trim();
        if (!trimmed) return;
        if (mode === 'signup') {
          await createUserWithEmailAndPassword(auth, trimmed, password);
          return;
        }
        await signInWithEmailAndPassword(auth, trimmed, password);
      },
      signOut: async () => {
        await firebaseSignOut(auth);
        setUser(null);
      },
    }),
    [user, isAuthReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
