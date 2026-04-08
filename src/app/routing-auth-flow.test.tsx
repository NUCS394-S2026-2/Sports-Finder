import '@testing-library/jest-dom/vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider } from 'react-router';
import { describe, expect, test } from 'vitest';

import { AuthProvider } from './context/auth-context';
import { GamesProvider } from './context/games-context';
import { createTestMemoryRouter } from './routes';

function renderFullApp(
  initialEntries: string[],
  initialUser: import('./context/auth-context').AuthUser | null = null,
) {
  const router = createTestMemoryRouter(initialEntries);
  const view = render(
    <AuthProvider initialUser={initialUser}>
      <GamesProvider>
        <RouterProvider router={router} />
      </GamesProvider>
    </AuthProvider>,
  );
  return { router, ...view };
}

describe('routing and auth (browse without login; join routes require sign-in)', () => {
  test('index redirects to /home', async () => {
    const { router } = renderFullApp(['/']);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home');
    });
  });

  test('guest can open home and sees Wildcat welcome (no landing page)', async () => {
    renderFullApp(['/home'], null);
    expect(await screen.findByText(/Welcome back, Wildcat/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse all games/i })).toBeInTheDocument();
  });

  test('guest can open games feed and see a seeded game', async () => {
    renderFullApp(['/games'], null);
    expect(await screen.findByText('Hutchinson 7v7 weeknight')).toBeInTheDocument();
  });

  test('guest can open a game detail page', async () => {
    renderFullApp(['/games/1'], null);
    expect(await screen.findByText('Hutchinson 7v7 weeknight')).toBeInTheDocument();
  });

  test('guest is redirected to sign-in from /profile with next param', async () => {
    const { router } = renderFullApp(['/profile'], null);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
    expect(router.state.location.search).toContain(encodeURIComponent('/profile'));
  });

  test('guest is redirected to sign-in from /add-game', async () => {
    const { router } = renderFullApp(['/add-game'], null);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
    expect(router.state.location.search).toContain(encodeURIComponent('/add-game'));
  });

  test('guest is redirected to sign-in from /notifications', async () => {
    const { router } = renderFullApp(['/notifications'], null);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
    expect(router.state.location.search).toContain(encodeURIComponent('/notifications'));
  });

  test('signed-in user reaches profile without redirect', async () => {
    const user = { displayName: 'Test Host', email: 'host@u.northwestern.edu' };
    const { router } = renderFullApp(['/profile'], user);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/profile');
    });
    expect(await screen.findByText('Test Host')).toBeInTheDocument();
    const signOutButtons = screen.getAllByRole('button', { name: /Sign Out/i });
    expect(signOutButtons.length).toBeGreaterThanOrEqual(1);
  });

  test('guest clicking Join Game on detail navigates to sign-in with return URL to same game', async () => {
    const user = userEvent.setup();
    const { router } = renderFullApp(['/games/2'], null);
    expect(await screen.findByText('Northwestern courts doubles')).toBeInTheDocument();

    const joinCtas = screen.getAllByRole('button', { name: /Sign in to join/i });
    await user.click(joinCtas[0]!);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in');
    });
    expect(router.state.location.search).toContain(encodeURIComponent('/games/2'));
  });

  test('guest header offers Sign in link', async () => {
    renderFullApp(['/home'], null);
    expect(await screen.findByRole('link', { name: /^Sign in$/i })).toBeInTheDocument();
  });
});
