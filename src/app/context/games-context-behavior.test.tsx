import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, test } from 'vitest';

import { GamesProvider, useGames } from './games-context';

function JoinProbe({
  gameId,
  playerName,
  onResult,
}: {
  gameId: string;
  playerName: string;
  onResult?: (ok: boolean) => void;
}) {
  const { joinGame } = useGames();
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await joinGame(gameId, playerName);
        onResult?.(ok);
      }}
    >
      try-join
    </button>
  );
}

function PlayerCount({ gameId }: { gameId: string }) {
  const { games } = useGames();
  const g = games.find((x) => x.id === gameId);
  return <span data-testid={`count-${gameId}`}>{g?.currentPlayers ?? -1}</span>;
}

describe('GamesProvider joinGame scenarios', () => {
  test('returns true and increments roster when join is valid', async () => {
    const user = userEvent.setup();
    let result: boolean | undefined;
    render(
      <MemoryRouter>
        <GamesProvider>
          <JoinProbe
            gameId="2"
            playerName="New Player"
            onResult={(ok) => {
              result = ok;
            }}
          />
          <PlayerCount gameId="2" />
        </GamesProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('count-2')).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: /try-join/i }));

    expect(result).toBe(true);
    expect(screen.getByTestId('count-2')).toHaveTextContent('4');
  });

  test('returns false when player already has an overlapping game (double-booking)', async () => {
    const user = userEvent.setup();
    let result: boolean | undefined;
    render(
      <MemoryRouter>
        <GamesProvider>
          <JoinProbe
            gameId="6"
            playerName="Alex Kim"
            onResult={(ok) => {
              result = ok;
            }}
          />
          <PlayerCount gameId="6" />
        </GamesProvider>
      </MemoryRouter>,
    );

    const before = screen.getByTestId('count-6').textContent;
    await user.click(screen.getByRole('button', { name: /try-join/i }));

    expect(result).toBe(false);
    expect(screen.getByTestId('count-6')).toHaveTextContent(before!);
  });

  test('returns false when game is full', async () => {
    const user = userEvent.setup();
    let result: boolean | undefined;
    render(
      <MemoryRouter>
        <GamesProvider>
          <JoinProbe
            gameId="4"
            playerName="Walk On"
            onResult={(ok) => {
              result = ok;
            }}
          />
        </GamesProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /try-join/i }));
    expect(result).toBe(false);
  });

  test('returns false when player is already on the roster', async () => {
    const user = userEvent.setup();
    let result: boolean | undefined;
    render(
      <MemoryRouter>
        <GamesProvider>
          <JoinProbe
            gameId="1"
            playerName="Alex Kim"
            onResult={(ok) => {
              result = ok;
            }}
          />
        </GamesProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /try-join/i }));
    expect(result).toBe(false);
  });
});
