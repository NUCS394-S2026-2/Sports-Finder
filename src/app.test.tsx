import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import App from './App';
import { initialGames } from './data';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { PickupGame } from './types';

vi.mock('./lib/firebase', () => ({
  isFirebaseConfigured: vi.fn(() => true),
  getFirebaseAuth: vi.fn(() => ({})),
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
    signInWithPopup: vi.fn(async () => {
      const u = { email: 'taylor@example.com', displayName: 'Taylor' };
      state.listener?.(u);
      return { user: u };
    }),
    signOut: vi.fn(() => Promise.resolve()),
  };
});

vi.mock('./lib/games', () => ({
  fetchGames: vi.fn(),
  createGame: vi.fn(),
  joinGame: vi.fn(),
  leaveGame: vi.fn(),
}));

const mockedFetchGames = vi.mocked(fetchGames);
const mockedCreateGame = vi.mocked(createGame);
const mockedJoinGame = vi.mocked(joinGame);

const newGame: PickupGame = {
  id: 'new-game-id',
  sport: 'Soccer',
  location: 'North Field',
  startTime: '2026-04-02T18:30',
  endTime: '2026-04-02T20:00',
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
  vi.clearAllMocks();
  mockedFetchGames.mockReturnValue(initialGames as PickupGame[]);
  mockedCreateGame.mockReturnValue({ game: newGame });
  mockedJoinGame.mockReturnValue([newGame]);
});

describe('App', () => {
  test('renders the hero and primary calls to action', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: /your next game starts here/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse games/i })).toBeInTheDocument();
  });

  test('navigates to games feed from the hero', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('heading', { name: /your next game starts here/i });

    await user.click(screen.getByRole('button', { name: /browse games/i }));

    expect(screen.getByPlaceholderText(/search by sport/i)).toBeInTheDocument();
  });

  test('shows profile mission content from the desktop navigation', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('heading', { name: /your next game starts here/i });

    const header = screen.getByRole('banner');
    await user.click(within(header).getByRole('button', { name: /^profile$/i }));

    expect(
      screen.getByRole('heading', { name: /why pickup sports finder exists/i }),
    ).toBeInTheDocument();
  });

  test('can add a new pickup game to the games list', async () => {
    const user = userEvent.setup();

    mockedFetchGames.mockReturnValueOnce(initialGames as PickupGame[]);

    render(<App />);

    await screen.findByRole('heading', { name: /your next game starts here/i });

    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: /^sign in$/i }),
    );

    const authDialog = await screen.findByRole('dialog', {
      name: /sign in to join the game/i,
    });
    await user.click(
      within(authDialog).getByRole('button', { name: /continue with google/i }),
    );

    await waitFor(() => {
      expect(screen.getByRole('banner')).toHaveTextContent(/Taylor/i);
    });

    await user.click(
      within(screen.getByRole('banner')).getByRole('button', { name: /host a game/i }),
    );

    await user.click(screen.getByRole('button', { name: /^soccer$/i }));

    await user.selectOptions(screen.getByLabelText(/court \/ venue/i), 'Hutchson Field');

    fireEvent.change(screen.getByLabelText(/^date$/i), {
      target: { value: '2026-04-16' },
    });

    const startSelect = screen.getByLabelText(/^start time$/i);
    const startOptions = Array.from(
      (startSelect as HTMLSelectElement).querySelectorAll('option'),
    ).map((o) => o.value);
    const firstStart = startOptions.find((v) => v && v !== '');
    if (firstStart) fireEvent.change(startSelect, { target: { value: firstStart } });

    const endSelect = screen.getByLabelText(/^end time$/i);
    const endOptions = Array.from(
      (endSelect as HTMLSelectElement).querySelectorAll('option'),
    )
      .map((o) => o.value)
      .filter(Boolean);
    const firstEnd = endOptions.find((v) => v !== '');
    if (firstEnd) fireEvent.change(endSelect, { target: { value: firstEnd } });

    await user.selectOptions(screen.getByLabelText(/age range/i), '18+');

    await user.click(screen.getByRole('button', { name: /post game/i }));

    expect(mockedCreateGame).toHaveBeenCalled();
  });
});
