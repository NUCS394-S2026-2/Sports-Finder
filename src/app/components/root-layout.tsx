import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../context/auth-context';
import { AppLayout } from './layout';

const AUTH_REQUIRED_PREFIXES = ['/add-game', '/profile', '/notifications'] as const;

/** Exported for tests — must stay aligned with auth redirect rules. */
export function pathRequiresAuth(pathname: string): boolean {
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function RootLayout() {
  const { user, isAuthReady } = useAuth();
  const loc = useLocation();

  if (loc.pathname === '/sign-in') {
    return <Outlet />;
  }

  if (!isAuthReady) {
    return null;
  }

  if (!user && pathRequiresAuth(loc.pathname)) {
    const next = encodeURIComponent(`${loc.pathname}${loc.search}`);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
