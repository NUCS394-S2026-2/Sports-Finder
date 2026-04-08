/** Minimum time between posting and game start (host form). */
export const MIN_HOST_LEAD_MS = 5 * 60 * 60 * 1000;

export function getLocalStartMsFromParts(isoDate: string, timeHm: string): number | null {
  if (!isoDate || !timeHm) return null;
  const ms = new Date(`${isoDate}T${timeHm}:00`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** True if start is at least `MIN_HOST_LEAD_MS` after `nowMs`. */
export function meetsMinimumHostLead(
  isoDate: string,
  timeHm: string,
  nowMs: number,
): boolean {
  const start = getLocalStartMsFromParts(isoDate, timeHm);
  if (start === null) return false;
  return start - nowMs >= MIN_HOST_LEAD_MS;
}

export interface AutoCancelGame {
  id: string;
  date: string;
  time: string;
  minPlayers: number;
  currentPlayers: number;
  cancelled?: boolean;
}

/**
 * Marks games as cancelled when: within 30 minutes of start, not yet started,
 * and current roster is below minimum players.
 */
export function applyAutoCancellation<T extends AutoCancelGame>(
  games: T[],
  nowMs: number,
): T[] {
  return games.map((game) => {
    if (game.cancelled) return game;
    const startMs = Date.parse(`${game.date} ${game.time}`);
    if (Number.isNaN(startMs)) return game;
    const thirtyMinBeforeStart = startMs - 30 * 60 * 1000;
    const inCancellationWindow = nowMs >= thirtyMinBeforeStart && nowMs < startMs;
    if (inCancellationWindow && game.currentPlayers < game.minPlayers) {
      return { ...game, cancelled: true };
    }
    return game;
  });
}
