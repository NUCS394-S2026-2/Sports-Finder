import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import App from './App';
import { initialGames } from './data';
import {
  fetchUserProfile,
  loginWithEmail,
  logout,
  registerWithProfile,
  subscribeToAuth,
} from './lib/auth';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { PickupGame } from './types';

vi.mock('./lib/games', () => ({
  fetchGames: vi.fn(),
  createGame: vi.fn(),
  joinGame: vi.fn(),
}));

vi.mock('./lib/auth', () => ({
  subscribeToAuth: vi.fn(),
  fetchUserProfile: vi.fn(),
  loginWithEmail: vi.fn(),
  registerWithProfile: vi.fn(),
  logout: vi.fn(),
}));

const mockedFetchGames = vi.mocked(fetchGames);
const mockedCreateGame = vi.mocked(createGame);
const mockedJoinGame = vi.mocked(joinGame);
const mockedSubscribeToAuth = vi.mocked(subscribeToAuth);
const mockedFetchUserProfile = vi.mocked(fetchUserProfile);
const mockedLoginWithEmail = vi.mocked(loginWithEmail);
const mockedRegisterWithProfile = vi.mocked(registerWithProfile);
const mockedLogout = vi.mocked(logout);

beforeEach(() => {
  vi.clearAllMocks();
  mockedFetchGames.mockResolvedValue(initialGames as PickupGame[]);
  mockedCreateGame.mockResolvedValue();
  mockedJoinGame.mockResolvedValue();
  mockedSubscribeToAuth.mockImplementation((callback) => {
    callback(null);
    return vi.fn();
  });
  mockedFetchUserProfile.mockResolvedValue(null);
  mockedLoginWithEmail.mockResolvedValue();
  mockedRegisterWithProfile.mockResolvedValue({
    uid: 'u1',
    email: 'test@example.com',
    name: 'Test',
    age: 20,
    gender: 'Other',
  });
  mockedLogout.mockResolvedValue();
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

  test('requires login before showing create game form', async () => {
    const user = userEvent.setup();

    render(<App />);

    await screen.findByRole('button', { name: 'Homepage' });
    await user.click(screen.getByRole('button', { name: 'Create a Game' }));

    expect(screen.getByRole('heading', { name: /log in required/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in to create/i })).toBeInTheDocument();
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
