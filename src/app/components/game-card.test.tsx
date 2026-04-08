import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { Game } from '../context/games-context';
import { GameCard } from './game-card';

const { joinGameMock, leaveGameMock, navigateMock } = vi.hoisted(() => ({
  joinGameMock: vi.fn(),
  leaveGameMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('../context/games-context', () => ({
  useGames: () => ({
    joinGame: joinGameMock.mockReturnValue(true),
    leaveGame: leaveGameMock,
  }),
}));

vi.mock('../context/auth-context', () => ({
  useAuth: () => ({
    user: { displayName: 'Test User', email: 'tu@u.northwestern.edu' },
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
  id: 'game-1',
  sport: 'Soccer',
  title: 'Campus 3v3',
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
  notes: 'Bring water.',
  players: [],
  hostName: 'Jordan Lee',
};

afterEach(() => {
  vi.clearAllMocks();
});

function renderCard(game: Game = baseGame) {
  return render(
    <MemoryRouter>
      <GameCard game={game} />
    </MemoryRouter>,
  );
}

describe('GameCard', () => {
  test('renders key game information', () => {
    renderCard();

    expect(screen.getByText('Campus 3v3')).toBeInTheDocument();
    expect(screen.getByText(/Hutchinson Field/)).toBeInTheDocument();
    expect(screen.getByText('Apr 10, 2026')).toBeInTheDocument();
    expect(screen.getByText(/18:30/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
  });

  test('joins and leaves game when button is clicked', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Join' }));

    expect(joinGameMock).toHaveBeenCalledWith('game-1', 'Test User');
    expect(navigateMock).toHaveBeenCalledWith('/games/game-1');
    expect(screen.getByRole('button', { name: 'Leave' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Leave' }));

    expect(leaveGameMock).toHaveBeenCalledWith('game-1', 'Test User');
  });

  test('disables action when game is full and user has not joined', async () => {
    const user = userEvent.setup();
    const fullGame: Game = {
      ...baseGame,
      id: 'game-full',
      currentPlayers: 10,
      maxPlayers: 10,
      players: ['Alex'],
    };

    renderCard(fullGame);

    const fullButton = screen.getByRole('button', { name: 'Full' });
    expect(fullButton).toBeDisabled();

    await user.click(fullButton);
    expect(joinGameMock).not.toHaveBeenCalled();
  });
});
