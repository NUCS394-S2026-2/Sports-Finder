import { render, screen } from '@testing-library/react';
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

  test('shows progressive sport step in create flow', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('button', { name: 'Homepage' });
    await user.click(screen.getByRole('button', { name: 'Create a Game' }));

    expect(screen.getByRole('button', { name: 'Tennis' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Soccer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ultimate Frisbee' })).toBeInTheDocument();
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
