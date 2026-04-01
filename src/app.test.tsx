import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('Sports Finder App', () => {
  test('renders the Sports Finder heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /sports finder/i })).toBeInTheDocument();
  });

  test('allows user to create a new event', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('e.g. Soccer'), 'Tennis');
    await user.type(
      screen.getByPlaceholderText('e.g. Campus Rec Field'),
      'Campus Courts',
    );
    await user.type(screen.getByLabelText(/date and time/i), '2026-04-10T17:00');
    await user.selectOptions(screen.getByRole('combobox'), 'Beginner');
    await user.clear(screen.getByLabelText(/total spots/i));
    await user.type(screen.getByLabelText(/total spots/i), '8');
    await user.type(screen.getByPlaceholderText('Your name'), 'Damini');

    await user.click(screen.getByRole('button', { name: /post event/i }));

    expect(screen.getByText('Tennis')).toBeInTheDocument();
    expect(screen.getByText(/campus courts/i)).toBeInTheDocument();
    expect(screen.getByText(/damini/i)).toBeInTheDocument();
  });
});
