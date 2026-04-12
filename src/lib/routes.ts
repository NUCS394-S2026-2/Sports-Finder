import type { ViewName } from '../components/ui/viewNames';

export const paths = {
  home: '/',
  games: '/games',
  game: (id: string) => `/games/${encodeURIComponent(id)}`,
  host: '/host',
  profile: '/profile',
  notifications: '/notifications',
} as const;

const viewPaths: Record<Exclude<ViewName, 'game-detail'>, string> = {
  home: paths.home,
  find: paths.games,
  create: paths.host,
  profile: paths.profile,
  notifications: paths.notifications,
};

export function pathForView(view: Exclude<ViewName, 'game-detail'>): string {
  return viewPaths[view];
}

/** Map URL to tab / shell highlight state (game detail counts as Games). */
export function viewFromPathname(pathname: string): ViewName {
  if (pathname === paths.home) return 'home';
  if (pathname === paths.games) return 'find';
  if (pathname.startsWith(`${paths.games}/`)) return 'game-detail';
  if (pathname === paths.host) return 'create';
  if (pathname === paths.profile) return 'profile';
  if (pathname === paths.notifications) return 'notifications';
  return 'home';
}
