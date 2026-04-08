/** Minimal fields needed for schedule overlap (matches `Game` in context). */
export interface GameTimeFields {
  id: string;
  date: string;
  time: string;
  endTime?: string;
  players: string[];
  cancelled?: boolean;
}

const DEFAULT_DURATION_MS = 90 * 60 * 1000;

/** Parse display date + HH:mm into local timestamps for overlap checks. */
export function parseGameTimeRange(game: GameTimeFields): {
  startMs: number;
  endMs: number;
} | null {
  const startMs = Date.parse(`${game.date} ${game.time}`);
  if (Number.isNaN(startMs)) return null;

  let endMs: number;
  if (game.endTime) {
    endMs = Date.parse(`${game.date} ${game.endTime}`);
    if (Number.isNaN(endMs)) endMs = startMs + DEFAULT_DURATION_MS;
  } else {
    endMs = startMs + DEFAULT_DURATION_MS;
  }
  if (endMs <= startMs) endMs = startMs + 60 * 60 * 1000;
  return { startMs, endMs };
}

export function timeRangesOverlap(
  a: { startMs: number; endMs: number },
  b: { startMs: number; endMs: number },
): boolean {
  return a.startMs < b.endMs && b.startMs < a.endMs;
}

/** True if `playerName` is rostered on another game whose time overlaps `candidate`. */
export function playerHasSchedulingConflict(
  games: GameTimeFields[],
  playerName: string,
  candidate: GameTimeFields,
): boolean {
  const cand = parseGameTimeRange(candidate);
  if (!cand) return false;

  for (const g of games) {
    if (g.id === candidate.id) continue;
    if (g.cancelled) continue;
    if (!g.players.includes(playerName)) continue;
    const gr = parseGameTimeRange(g);
    if (!gr) continue;
    if (timeRangesOverlap(cand, gr)) return true;
  }
  return false;
}
