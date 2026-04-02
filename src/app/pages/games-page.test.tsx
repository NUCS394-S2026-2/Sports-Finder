import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { GamesProvider } from '../context/games-context';
import { GamesPage } from './games-page';

describe('GamesPage', () => {
  test('filters visible games by sport', async () => {
    const user = userEvent.setup();

    render(
      <GamesProvider>
        <GamesPage />
      </GamesProvider>,
    );

    expect(screen.getByText('Sunset 3v3 Pick-up')).toBeInTheDocument();
    expect(screen.getByText('Beach Volleyball Throwdown')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volleyball' }));

    expect(screen.getByText('Beach Volleyball Throwdown')).toBeInTheDocument();
    expect(screen.queryByText('Sunset 3v3 Pick-up')).not.toBeInTheDocument();
  });
});
