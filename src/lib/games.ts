import { initialGames } from '../data';
import type { GameDraft, PickupGame, SportName, User } from '../types';

export function fetchGames(): PickupGame[] {
  // In prototype, return initial games. In real app, this would load from storage.
  return initialGames;
}

export function createGame(
  draft: GameDraft,
  games: PickupGame[],
  options?: { ignoreConflict?: boolean },
): { game?: PickupGame; conflict?: PickupGame } {
  // Check for conflict: same sport, location, and start times within 30 minutes
  const conflict = options?.ignoreConflict
    ? undefined
    : games.find(
        (g) =>
          g.sport === draft.sport &&
          g.location === draft.location &&
          Math.abs(
            new Date(g.startTime).getTime() - new Date(draft.startTime).getTime(),
          ) <
            30 * 60 * 1000,
      );

  if (conflict) {
    return { conflict };
  }

  const newGame: PickupGame = {
    id: Date.now().toString(), // simple ID
    sport: draft.sport as SportName,
    location: draft.location,
    startTime: draft.startTime,
    endTime: draft.endTime,
    capacity: draft.capacity,
    organizer: draft.organizer,
    note: draft.note,
    skillLevel: draft.skillLevel,
    ageRange: draft.ageRange,
    gender: draft.gender,
    requirements: draft.requirements,
    players: [{ name: draft.organizer.split('@')[0], email: draft.organizer }], // organizer as first player
  };

  return { game: newGame };
}

export function joinGame(gameId: string, user: User, games: PickupGame[]): PickupGame[] {
  return games.map((g) => {
    if (
      g.id === gameId &&
      g.players.length < g.capacity &&
      !g.players.some((p) => p.email === user.email)
    ) {
      return { ...g, players: [...g.players, user] };
    }
    return g;
  });
}

export function leaveGame(gameId: string, user: User, games: PickupGame[]): PickupGame[] {
  return games.map((g) => {
    if (g.id !== gameId) return g;
    return {
      ...g,
      players: g.players.filter((p) => p.email !== user.email),
    };
  });
}
