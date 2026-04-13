import { useEffect, useId, useRef, useState } from 'react';

import type { User } from '../../types';
import { Button } from './Button';
import type { ViewName } from './viewNames';

type AppNavbarProps = {
  activeView: ViewName;
  onNavigate: (view: ViewName) => void;
  user: User | null;
  onSignIn: () => void;
  onLogout: () => void;
  /** When true, shows bell + mobile Notifications entry (feature off by default). */
  showNotifications?: boolean;
  onOpenNotificationsPage?: () => void;
  notificationsOpen?: boolean;
  onNotificationsOpenChange?: (open: boolean) => void;
  notificationsDropdown?: React.ReactNode;
};

const centerNav: Array<{ view: ViewName; label: string }> = [
  { view: 'home', label: 'Home' },
  { view: 'find', label: 'Games' },
  { view: 'create', label: 'Host a Game' },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppNavbar({
  activeView,
  onNavigate,
  user,
  onSignIn,
  onLogout,
  showNotifications = false,
  onOpenNotificationsPage,
  notificationsOpen = false,
  onNotificationsOpenChange,
  notificationsDropdown,
}: AppNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (showNotifications && notifRef.current && !notifRef.current.contains(t)) {
        onNotificationsOpenChange?.(false);
      }
      if (userRef.current && !userRef.current.contains(t)) {
        setUserOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showNotifications, onNotificationsOpenChange]);

  function navTargetActive(view: ViewName): boolean {
    if (view === 'find') return activeView === 'find' || activeView === 'game-detail';
    return activeView === view;
  }

  function handleCenterNav(view: ViewName) {
    onNavigate(view);
    setMenuOpen(false);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-[rgba(9,15,24,0.88)] shadow-[0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-5 md:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none">
          <button
            type="button"
            onClick={() => handleCenterNav('home')}
            className="truncate text-left font-bold text-xl text-cream"
          >
            <span className="text-brand-500">Pickup</span>{' '}
            <span className="text-cream">Sports Finder</span>
          </button>
        </div>

        <nav
          className="hidden flex-1 items-center justify-center gap-2 md:flex"
          aria-label="Sections"
        >
          {centerNav.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => handleCenterNav(item.view)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                navTargetActive(item.view)
                  ? 'text-brand-400'
                  : 'text-cream-muted hover:text-cream'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0 md:flex-1 md:justify-end">
          {showNotifications && (
            <div className="relative hidden md:block" ref={notifRef}>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-lg text-cream transition hover:bg-white/10"
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onNotificationsOpenChange?.(!notificationsOpen);
                  setUserOpen(false);
                }}
              >
                <span aria-hidden>🔔</span>
                <span className="sr-only">Notifications</span>
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.96)] shadow-2xl shadow-black/40 backdrop-blur-xl">
                  {notificationsDropdown}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative hidden md:block" ref={userRef}>
              <button
                type="button"
                className="flex h-11 min-w-11 items-center gap-2 rounded-full border border-white/15 pl-1 pr-3 transition hover:bg-white/10"
                aria-expanded={userOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setUserOpen((v) => !v);
                  onNotificationsOpenChange?.(false);
                }}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-400 text-xs font-extrabold text-ink">
                  {initials(user.name)}
                </span>
                <span className="max-w-[8rem] truncate text-sm font-semibold text-cream">
                  {user.name}
                </span>
              </button>
              {userOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-52 overflow-hidden rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.96)] py-2 shadow-xl shadow-black/40 backdrop-blur-xl"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-4 py-3 text-left text-sm font-semibold text-cream hover:bg-white/10"
                    onClick={() => {
                      setUserOpen(false);
                      onNavigate('profile');
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full px-4 py-3 text-left text-sm text-cream-muted hover:bg-white/10 hover:text-cream"
                    onClick={() => {
                      setUserOpen(false);
                      onLogout();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="hidden rounded-full px-3 py-2 text-sm font-semibold text-cream-muted transition hover:text-cream md:inline-flex"
                onClick={() => onNavigate('profile')}
              >
                Profile
              </button>
              <Button
                variant="primary"
                className="hidden px-6 md:inline-flex"
                type="button"
                onClick={onSignIn}
              >
                Sign In
              </Button>
            </>
          )}

          <button
            type="button"
            className="flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-white/15 text-cream transition hover:bg-white/10 md:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden className="text-xl">
              {menuOpen ? '×' : '≡'}
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id={menuId}
          className="border-t border-white/10 bg-[rgba(9,15,24,0.95)] px-4 py-4 md:hidden"
          role="dialog"
          aria-label="Menu"
        >
          <div className="mx-auto flex max-w-lg flex-col gap-2">
            {showNotifications && (
              <button
                type="button"
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left font-semibold text-cream hover:bg-white/10"
                onClick={() => {
                  onOpenNotificationsPage?.();
                  setMenuOpen(false);
                }}
              >
                Notifications
              </button>
            )}
            {user ? (
              <>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center rounded-xl px-3 text-left font-semibold text-cream hover:bg-white/10"
                  onClick={() => {
                    handleCenterNav('profile');
                  }}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-cream-muted hover:bg-white/10 hover:text-cream"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                type="button"
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left font-semibold text-brand-400 hover:bg-white/10"
                onClick={() => {
                  setMenuOpen(false);
                  onSignIn();
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
