import { createBrowserRouter, createMemoryRouter, Navigate } from 'react-router';

import { RootLayout } from './components/root-layout';
import { AddGamePage } from './pages/add-game-page';
import { GameDetailPage } from './pages/game-detail-page';
import { GamesPage } from './pages/games-page';
import { HomePage } from './pages/home-page';
import { ProfilePage } from './pages/profile-page';
import { SignInPage } from './pages/sign-in-page';

/** Shared with tests so navigation behavior matches production. */
export const appRoutes = [
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'sign-in', Component: SignInPage },
      { path: 'home', Component: HomePage },
      { path: 'games', Component: GamesPage },
      { path: 'games/:gameId', Component: GameDetailPage },
      { path: 'add-game', Component: AddGamePage },
      { path: 'profile', Component: ProfilePage },
    ],
  },
];

export const router = createBrowserRouter(appRoutes);

export function createTestMemoryRouter(initialEntries: string[]) {
  return createMemoryRouter(appRoutes, { initialEntries });
}
