import { Home, LayoutGrid, Menu, Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';

import { useAuth } from '../context/auth-context';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

function LogoLink() {
  return (
    <Link
      to="/home"
      className="flex items-center gap-2 text-xl font-bold text-text-primary"
    >
      <span className="relative pr-1">
        Pickup Sports
        <span
          className="absolute -right-1 top-1.5 h-2 w-2 rounded-full bg-brand"
          aria-hidden
        />
      </span>
    </Link>
  );
}

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const content = children ?? <Outlet />;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-brand' : 'text-text-secondary hover:text-brand'
    }`;

  const tabClass = (isActive: boolean) =>
    `flex min-h-[44px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
      isActive ? 'text-brand' : 'text-text-muted'
    }`;

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-gray-100 bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 md:px-10 lg:h-16 lg:px-16">
          <LogoLink />

          <nav className="hidden flex-1 items-center justify-center gap-10 lg:flex">
            <NavLink to="/home" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/games" className={linkClass}>
              Games
            </NavLink>
            <NavLink to="/add-game" className={linkClass}>
              Host a Game
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 lg:flex">
              {user ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand ring-2 ring-white"
                      aria-label="Account menu"
                    >
                      {user.displayName
                        .split(/\s+/)
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-56 rounded-xl border border-gray-100 p-2 shadow-xl"
                  >
                    <Link
                      to="/profile"
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-text-primary hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-muted hover:bg-gray-50 hover:text-red-500"
                    >
                      Sign out
                    </button>
                  </PopoverContent>
                </Popover>
              ) : (
                <Link
                  to={`/sign-in?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                  className="app-btn-ghost inline-flex min-h-[44px] items-center px-4"
                >
                  Sign in
                </Link>
              )}
            </div>

            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] text-text-secondary hover:bg-gray-50 lg:hidden"
              aria-expanded={sheetOpen}
              aria-label="Menu"
              onClick={() => setSheetOpen((o) => !o)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {sheetOpen ? (
          <div className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
            <nav className="flex flex-col gap-1">
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  `min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium ${isActive ? 'bg-brand-light text-brand' : 'text-text-secondary'}`
                }
                onClick={() => setSheetOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/games"
                className={({ isActive }) =>
                  `min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium ${isActive ? 'bg-brand-light text-brand' : 'text-text-secondary'}`
                }
                onClick={() => setSheetOpen(false)}
              >
                Games
              </NavLink>
              <NavLink
                to="/add-game"
                className={({ isActive }) =>
                  `min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium ${isActive ? 'bg-brand-light text-brand' : 'text-text-secondary'}`
                }
                onClick={() => setSheetOpen(false)}
              >
                Host a Game
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `min-h-[44px] rounded-lg px-3 py-3 text-sm font-medium ${isActive ? 'bg-brand-light text-brand' : 'text-text-secondary'}`
                }
                onClick={() => setSheetOpen(false)}
              >
                Profile
              </NavLink>
              {!user ? (
                <button
                  type="button"
                  className="app-btn-ghost mt-2 inline-flex min-h-[44px] w-full items-center justify-center"
                  onClick={() => {
                    setSheetOpen(false);
                    navigate(
                      `/sign-in?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`,
                    );
                  }}
                >
                  Sign in
                </button>
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="mx-auto min-h-screen max-w-7xl px-4 pb-28 pt-20 sm:px-6 md:px-10 lg:px-16 lg:pb-12 lg:pt-24">
        {content}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-lg items-end justify-around px-2">
          <NavLink to="/home" className={({ isActive }) => tabClass(isActive)} end>
            <Home className="h-6 w-6" />
            <span>Home</span>
          </NavLink>
          <NavLink to="/games" className={({ isActive }) => tabClass(isActive)}>
            <LayoutGrid className="h-6 w-6" />
            <span>Games</span>
          </NavLink>
          <NavLink
            to="/add-game"
            className="-mt-6 flex min-h-[44px] flex-col items-center justify-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(217,109,77,0.35)] ring-4 ring-background">
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </span>
            <span
              className={`mt-1 text-xs font-medium ${
                location.pathname === '/add-game' ? 'text-brand' : 'text-text-muted'
              }`}
            >
              Host
            </span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => tabClass(isActive)}>
            <UserRound className="h-6 w-6" />
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
