import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { AuthProvider } from '../context/auth-context';
import { AddGamePage } from './add-game-page';

const { addGameMock, navigateMock, toastErrorMock, toastSuccessMock } = vi.hoisted(
  () => ({
    addGameMock: vi.fn(),
    navigateMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
  }),
);

vi.mock('../context/games-context', () => ({
  useGames: () => ({
    addGame: addGameMock,
    games: [],
  }),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('AddGamePage', () => {
  test('shows validation error when required fields are missing', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider
          initialUser={{ displayName: 'Host Person', email: 'hp@u.northwestern.edu' }}
        >
          <AddGamePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form as HTMLFormElement);

    expect(toastErrorMock).toHaveBeenCalledWith('Please fill in all required fields');
    expect(addGameMock).not.toHaveBeenCalled();
  });

  test('submits game and navigates to games when form is complete', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <AuthProvider
          initialUser={{ displayName: 'Host Person', email: 'hp@u.northwestern.edu' }}
        >
          <AddGamePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(
      screen.getByPlaceholderText('e.g. Sunset 5v5 pickup'),
      'Northwestern Open Run',
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInputs = container.querySelectorAll('input[type="time"]');

    fireEvent.change(dateInput, { target: { value: '2026-04-20' } });
    fireEvent.change(timeInputs[0], { target: { value: '19:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '20:30' } });

    await user.click(screen.getByRole('button', { name: 'Post Game' }));

    expect(addGameMock).toHaveBeenCalledWith({
      sport: 'Tennis',
      title: 'Northwestern Open Run',
      location: 'Northwestern Tennis Courts',
      address: '2311 Campus Dr, Evanston, IL',
      date: 'Apr 20, 2026',
      time: '19:00',
      endTime: '20:30',
      maxPlayers: 10,
      minPlayers: 4,
      competitiveLevel: 'Casual',
      gender: 'Co-ed',
      notes: undefined,
      hostName: 'Host Person',
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Game created successfully!');
    expect(navigateMock).toHaveBeenCalledWith('/games');
  });

  test('allows min players at 0 and caps max at 30 in the UI', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <AuthProvider
          initialUser={{ displayName: 'Host Person', email: 'hp@u.northwestern.edu' }}
        >
          <AddGamePage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(
      screen.getByPlaceholderText('e.g. Sunset 5v5 pickup'),
      'Zero min test',
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInputs = container.querySelectorAll('input[type="time"]');
    fireEvent.change(dateInput, { target: { value: '2026-05-01' } });
    fireEvent.change(timeInputs[0], { target: { value: '19:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '20:30' } });

    const minRow = screen.getByText('Min players').parentElement!;
    const minusMin = minRow.querySelectorAll('button')[0]!;
    for (let i = 0; i < 6; i += 1) {
      fireEvent.click(minusMin);
    }

    const maxRow = screen.getByText('Max players').parentElement!;
    const plusMax = maxRow.querySelectorAll('button')[1]!;
    for (let i = 0; i < 40; i += 1) {
      fireEvent.click(plusMax);
    }

    expect(minRow).toHaveTextContent('0');
    expect(maxRow).toHaveTextContent('30');

    await user.click(screen.getByRole('button', { name: 'Post Game' }));

    expect(addGameMock).toHaveBeenCalledWith(
      expect.objectContaining({
        minPlayers: 0,
        maxPlayers: 30,
        title: 'Zero min test',
      }),
    );
  });
});
