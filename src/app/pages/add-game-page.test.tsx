import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

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
  useGames: () => ({ addGame: addGameMock }),
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
    const { container } = render(<AddGamePage />);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    fireEvent.submit(form as HTMLFormElement);

    expect(toastErrorMock).toHaveBeenCalledWith('Please fill in all required fields');
    expect(addGameMock).not.toHaveBeenCalled();
  });

  test('submits game and navigates home when form is complete', async () => {
    const user = userEvent.setup();
    const { container } = render(<AddGamePage />);

    await user.type(
      screen.getByPlaceholderText('e.g. Sunset 3v3 Pick-up'),
      'Northwestern Open Run',
    );
    await user.type(
      screen.getByPlaceholderText('Search court or address'),
      'Blomquist Recreation Center',
    );

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = container.querySelector('input[type="time"]') as HTMLInputElement;

    fireEvent.change(dateInput, { target: { value: '2026-04-20' } });
    fireEvent.change(timeInput, { target: { value: '19:00' } });

    await user.click(screen.getByRole('button', { name: 'POST GAME' }));

    expect(addGameMock).toHaveBeenCalledWith({
      sport: 'Basketball',
      title: 'Northwestern Open Run',
      location: 'Blomquist Recreation Center',
      date: '2026-04-20',
      time: '19:00',
      maxPlayers: 12,
      competitiveLevel: 'Casual',
      notes: undefined,
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Game created successfully!');
    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});
