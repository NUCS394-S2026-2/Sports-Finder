import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('App', () => {
  test('renders the pickup sports dashboard', () => {
    render(<App />);

    expect(screen.getByText(/Pickup Sports Finder/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming pickup games/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create a game/i })).toBeInTheDocument();
  });

  test('opens the create game form', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /create a game/i }));

    expect(
      screen.getByRole('heading', { name: /post a pickup game/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
  });

  test('can add a new pickup game', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole('button', { name: /create a game/i }));
    await user.selectOptions(screen.getByLabelText(/^sport$/i), 'Football');
    await user.type(screen.getByLabelText(/location/i), 'North Field');
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2026-04-02T18:30' },
    });
    await user.clear(screen.getByLabelText(/capacity/i));
    await user.type(screen.getByLabelText(/capacity/i), '8');
    await user.type(screen.getByLabelText(/organizer/i), 'Taylor');
    await user.type(screen.getByLabelText(/notes/i), 'Bring water and cleats.');

    await user.click(screen.getByRole('button', { name: /publish game/i }));

    expect(screen.getByRole('heading', { name: 'North Field' })).toBeInTheDocument();
  });

  test('joining a game increases the filled player count', async () => {
    const user = userEvent.setup();

    render(<App />);

    const joinButtons = screen.getAllByRole('button', { name: /join game/i });
    await user.click(joinButtons[0]);

    expect(screen.getByText('8/10')).toBeInTheDocument();
  });
});
