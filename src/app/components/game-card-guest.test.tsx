import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { Game } from '../context/games-context';
import { GameCard } from './game-card';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('../context/games-context', () => ({
  useGames: () => ({
    joinGame: vi.fn().mockReturnValue(true),
    leaveGame: vi.fn(),
  }),
}));

vi.mock('../context/auth-context', () => ({
  useAuth: () => ({
    user: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const baseGame: Game = {
  id: 'game-99',
  sport: 'Soccer',
  title: 'Guest join target',
  location: 'Hutchinson Field',
  address: 'Sheridan Rd & Lincoln St, Evanston, IL',
  date: 'Apr 10, 2026',
  time: '18:30',
  endTime: '20:00',
  maxPlayers: 10,
  minPlayers: 6,
  currentPlayers: 6,
  competitiveLevel: 'Intermediate',
  gender: 'Co-ed',
  notes: '',
  players: [],
  hostName: 'Host',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('GameCard guest user', () => {
  test('Join sends user to sign-in with next pointing at this game detail', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <GameCard game={baseGame} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /^Join$/i }));

    expect(navigateMock).toHaveBeenCalledWith(
      '/sign-in?next=' + encodeURIComponent('/games/game-99'),
    );
  });
});
