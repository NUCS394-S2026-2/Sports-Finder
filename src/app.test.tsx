import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import App from './App';
import { initialGames } from './data';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { PickupGame } from './types';

vi.mock('./lib/games', () => ({
  fetchGames: vi.fn(),
  createGame: vi.fn(),
  joinGame: vi.fn(),
}));

const mockedFetchGames = vi.mocked(fetchGames);
const mockedCreateGame = vi.mocked(createGame);
const mockedJoinGame = vi.mocked(joinGame);

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchGames.mockResolvedValue(initialGames as PickupGame[]);
  mockedCreateGame.mockResolvedValue();
  mockedJoinGame.mockResolvedValue();
});

describe('App', () => {
  test('renders the toolbar and homepage', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: 'Homepage' })).toBeInTheDocument();
    expect(
      await screen.findByText(/Find a pickup game without digging through group chats/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find local games' })).toBeInTheDocument();
  });

  test('navigates to local games and shows filters', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('button', { name: 'Homepage' });

    await user.click(screen.getByRole('button', { name: 'Find Local Games' }));

    expect(
      screen.getByRole('heading', { name: /filter by the fit that matters/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /beginner/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /women/i })).toBeInTheDocument();
  });

  test('can add a new pickup game to the local games grid', async () => {
    const user = userEvent.setup();

    const newGame: PickupGame = {
      id: 'new-game-id',
      sport: 'Basketball',
      location: 'North Field',
      startTime: '2026-04-02T18:30',
      capacity: 8,
      spotsFilled: 0,
      organizer: 'Taylor',
      note: 'Bring water and cleats.',
      skillLevel: 'Advanced',
      ageRange: '35-44',
      gender: 'Mixed',
    };

    mockedFetchGames
      .mockResolvedValueOnce(initialGames as PickupGame[])
      .mockResolvedValueOnce([newGame, ...(initialGames as PickupGame[])]);

    render(<App />);

    await screen.findByRole('button', { name: 'Homepage' });

    await user.click(screen.getByRole('button', { name: 'Create a Game' }));
    await user.type(screen.getByLabelText(/location/i), 'North Field');
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2026-04-02T18:30' },
    });
    await user.clear(screen.getByLabelText(/capacity/i));
    await user.type(screen.getByLabelText(/capacity/i), '8');
    await user.type(screen.getByLabelText(/organizer/i), 'Taylor');
    await user.type(screen.getByLabelText(/notes/i), 'Bring water and cleats.');
    await user.selectOptions(screen.getByLabelText(/skill level/i), 'Advanced');
    await user.selectOptions(screen.getByLabelText(/age range/i), '35-44');
    await user.selectOptions(screen.getByLabelText(/gender/i), 'Mixed');

    await user.click(screen.getByRole('button', { name: /publish game/i }));

    expect(
      await screen.findByRole('heading', { name: 'North Field' }),
    ).toBeInTheDocument();
  });

  test('shows the about page mission statement', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('button', { name: 'Homepage' });

    await user.click(screen.getByRole('button', { name: /about/i }));

    expect(screen.getByRole('heading', { name: /who are we/i })).toBeInTheDocument();
    expect(
      screen.getByText(/make recreational sports more accessible/i),
    ).toBeInTheDocument();
  });
});
