import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import App from './App';
import { initialGames } from './data';
import { getFirebaseAuth } from './lib/firebase';
import {
  addPlayerToGame,
  createGame,
  fetchGames,
  removePlayerFromGame,
  saveGame,
  seedGamesIfEmpty,
} from './lib/games';
import type { PickupGame } from './types';

const mockAuth = {
  authStateReady: vi.fn(() => Promise.resolve()),
  currentUser: null as { getIdToken: (forceRefresh?: boolean) => Promise<string> } | null,
};

vi.mock('./lib/firebase', () => ({
  isFirebaseConfigured: vi.fn(() => true),
  getFirebaseAuth: vi.fn(() => mockAuth),
  googleAuthProvider: {},
}));

vi.mock('firebase/auth', () => {
  const state: {
    listener: ((u: { email: string; displayName: string } | null) => void) | null;
  } = { listener: null };
  return {
    onAuthStateChanged: vi.fn((_auth: unknown, cb: (u: unknown) => void) => {
      state.listener = cb as (u: { email: string; displayName: string } | null) => void;
      cb(null);
      return () => {
        state.listener = null;
      };
    }),
    signInAnonymously: vi.fn(async () => {
      const u = { email: '', displayName: 'Guest' };
      mockAuth.currentUser = { getIdToken: async () => 'mock-token' };
      state.listener?.(u);
    }),
    signInWithPopup: vi.fn(async () => {
      const u = { email: 'taylor@example.com', displayName: 'Taylor' };
      mockAuth.currentUser = { getIdToken: async () => 'mock-token' };
      state.listener?.(u);
      return { user: u };
    }),
    signOut: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('./lib/games', () => ({
  fetchGames: vi.fn(),
  seedGamesIfEmpty: vi.fn(),
  saveGame: vi.fn(),
  addPlayerToGame: vi.fn(),
  createGame: vi.fn(),
  joinGame: vi.fn((gameId: string, user: { email: string }, prev: PickupGame[]) =>
    prev.map((g) => (g.id === gameId ? { ...g, players: [...g.players, user] } : g)),
  ),
  leaveGame: vi.fn((gameId: string, user: { email: string }, prev: PickupGame[]) =>
    prev.map((g) =>
      g.id === gameId
        ? { ...g, players: g.players.filter((p) => p.email !== user.email) }
        : g,
    ),
  ),
  removePlayerFromGame: vi.fn(),
  findConflict: vi.fn().mockReturnValue(undefined),
}));

const mockedFetchGames = vi.mocked(fetchGames);
vi.mocked(seedGamesIfEmpty).mockResolvedValue(undefined);
vi.mocked(addPlayerToGame).mockResolvedValue(undefined);
vi.mocked(removePlayerFromGame).mockResolvedValue(undefined);

const newGame: PickupGame = {
  id: 'new-game-id',
  sport: 'Soccer',
  location: 'Hutchson Field',
  startTime: '2026-04-20T18:30',
  endTime: '2026-04-20T20:00',
  capacity: 8,
  organizer: 'taylor@example.com',
  note: 'Bring water and cleats.',
  skillLevel: 'Advanced',
  ageRange: '18+',
  gender: 'Any',
  requirements: 'Cleats required.',
  players: [{ name: 'Taylor', email: 'taylor@example.com' }],
};

beforeEach(() => {
  mockAuth.currentUser = null;
  vi.clearAllMocks();
  vi.mocked(seedGamesIfEmpty).mockResolvedValue(undefined);
  vi.mocked(addPlayerToGame).mockResolvedValue(undefined);
  vi.mocked(removePlayerFromGame).mockResolvedValue(undefined);
  mockedFetchGames.mockResolvedValue(initialGames as PickupGame[]);
  vi.mocked(saveGame).mockResolvedValue(newGame);
  vi.mocked(createGame).mockResolvedValue({ game: newGame });
});

describe('App', () => {
  test('renders the hero and primary calls to action', async () => {
    render(<App />);

    expect(await screen.findByText(/Your next game starts here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse Games' })).toBeInTheDocument();
  });

  test('navigates to games list and shows search and sport filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/Your next game starts here/i);
    const sectionsNav = screen.getByRole('navigation', { name: 'Sections' });
    await user.click(within(sectionsNav).getByRole('button', { name: 'Games' }));

    expect(
      screen.getByPlaceholderText(/Search by sport, venue, or host/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tennis' })).toBeInTheDocument();
  });

  test('profile tab prompts sign-in when logged out', async () => {
    vi.mocked(getFirebaseAuth).mockReturnValue(null);
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/Your next game starts here/i);
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' });
    await user.click(within(primaryNav).getByRole('button', { name: 'Profile' }));

    expect(
      screen.getByText(/Sign in to see your stats and history/i),
    ).toBeInTheDocument();
    vi.mocked(getFirebaseAuth).mockReturnValue(mockAuth);
  });
});
