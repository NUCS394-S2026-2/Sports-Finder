import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import type { Game } from '../context/games-context';
import { GameCard } from './game-card';

const { joinGameMock, leaveGameMock } = vi.hoisted(() => ({
  joinGameMock: vi.fn(),
  leaveGameMock: vi.fn(),
}));

vi.mock('../context/games-context', () => ({
  useGames: () => ({
    joinGame: joinGameMock,
    leaveGame: leaveGameMock,
  }),
}));

const baseGame: Game = {
  id: 'game-1',
  sport: 'Basketball',
  title: 'Campus 3v3',
  location: 'Tech Court',
  date: 'Apr 10, 2026',
  time: '18:30',
  maxPlayers: 10,
  currentPlayers: 6,
  competitiveLevel: 'Intermediate',
  notes: 'Bring water.',
  players: [],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('GameCard', () => {
  test('renders key game information', () => {
    render(<GameCard game={baseGame} />);

    expect(screen.getByText('Campus 3v3')).toBeInTheDocument();
    expect(screen.getByText('Tech Court')).toBeInTheDocument();
    expect(screen.getByText('Apr 10, 2026')).toBeInTheDocument();
    expect(screen.getByText('18:30')).toBeInTheDocument();
    expect(screen.getByText('Join Game')).toBeInTheDocument();
  });

  test('joins and leaves game when button is clicked', async () => {
    const user = userEvent.setup();
    render(<GameCard game={baseGame} />);

    await user.click(screen.getByRole('button', { name: 'Join Game' }));

    expect(joinGameMock).toHaveBeenCalledWith('game-1', 'You');
    expect(screen.getByRole('button', { name: 'Leave Game' })).toBeInTheDocument();
    expect(screen.getByText('Joined')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Leave Game' }));

    expect(leaveGameMock).toHaveBeenCalledWith('game-1', 'You');
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

    render(<GameCard game={fullGame} />);

    const fullButton = screen.getByRole('button', { name: 'Game Full' });
    expect(fullButton).toBeDisabled();

    await user.click(fullButton);
    expect(joinGameMock).not.toHaveBeenCalled();
  });
});
