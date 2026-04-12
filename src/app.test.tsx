import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import App from './App';
import { initialGames } from './data';
import { addPlayerToGame, fetchGames, saveGame, seedGamesIfEmpty } from './lib/games';
import type { PickupGame } from './types';

vi.mock('./lib/games', () => ({
  fetchGames: vi.fn(),
  seedGamesIfEmpty: vi.fn(),
  saveGame: vi.fn(),
  addPlayerToGame: vi.fn(),
  findConflict: vi.fn().mockReturnValue(undefined),
}));

const mockedFetchGames = vi.mocked(fetchGames);
vi.mocked(seedGamesIfEmpty).mockResolvedValue(undefined);
vi.mocked(addPlayerToGame).mockResolvedValue(undefined);

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
  vi.clearAllMocks();
  vi.mocked(seedGamesIfEmpty).mockResolvedValue(undefined);
  vi.mocked(addPlayerToGame).mockResolvedValue(undefined);
  mockedFetchGames.mockResolvedValue(initialGames as PickupGame[]);
  vi.mocked(saveGame).mockResolvedValue(newGame);
});

describe('App', () => {
  test('renders the toolbar and homepage', async () => {
    render(<App />);

    expect(await screen.findByText(/Find a pickup game without digging through group chats/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find local games' })).toBeInTheDocument();
  });

  test('navigates to find games and shows filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/Find a pickup game/i);
    await user.click(screen.getByRole('button', { name: 'Find Games' }));

    expect(screen.getByText(/Browse by sport/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Beginner/i })).toBeInTheDocument();
  });

  test('shows the about page mission statement', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText(/Find a pickup game/i);
    await user.click(screen.getByRole('button', { name: /about/i }));

    expect(screen.getByRole('heading', { name: /why this exists/i })).toBeInTheDocument();
    expect(screen.getByText(/make recreational sports more accessible/i)).toBeInTheDocument();
  });
});
