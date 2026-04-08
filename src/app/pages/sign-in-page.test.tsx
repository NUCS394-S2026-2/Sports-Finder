import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { AuthProvider } from '../context/auth-context';
import { SignInPage } from './sign-in-page';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderSignIn(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider initialUser={null}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('SignInPage', () => {
  test('defaults redirect target to /home when next is absent', async () => {
    const user = userEvent.setup();
    renderSignIn('/sign-in');

    await user.type(screen.getByLabelText(/^Email$/i), 'nu@u.northwestern.edu');
    await user.type(screen.getByLabelText(/^Password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true });
  });

  test('uses next search param when present', async () => {
    const user = userEvent.setup();
    renderSignIn('/sign-in?next=' + encodeURIComponent('/games/5'));

    await user.type(screen.getByLabelText(/^Email$/i), 'nu@u.northwestern.edu');
    await user.type(screen.getByLabelText(/^Password$/i), 'secret');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(navigateMock).toHaveBeenCalledWith('/games/5', { replace: true });
  });
});
