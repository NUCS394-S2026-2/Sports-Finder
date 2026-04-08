import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, test } from 'vitest';

import { AuthProvider } from '../context/auth-context';
import { GamesProvider } from '../context/games-context';
import { GamesPage } from './games-page';

describe('GamesPage', () => {
  test('filters visible games by sport', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider
          initialUser={{ displayName: 'Test Wildcat', email: 'tw@u.northwestern.edu' }}
        >
          <GamesProvider>
            <GamesPage />
          </GamesProvider>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Hutchinson 7v7 weeknight')).toBeInTheDocument();
    expect(screen.getByText('Deering Meadow hat draw')).toBeInTheDocument();
    expect(screen.getByText("Women's")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Soccer' }));

    expect(screen.getByText('Hutchinson 7v7 weeknight')).toBeInTheDocument();
    expect(screen.queryByText('Deering Meadow hat draw')).not.toBeInTheDocument();
  });
});
