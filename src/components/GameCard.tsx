import { locations } from '../data';
import { formatGameTime } from '../lib/datetime';
import { competitiveLabel, sportEmoji } from '../lib/sports';
import type { PickupGame } from '../types';
import { Button } from './ui/Button';

type GameCardProps = {
  game: PickupGame;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onOpenDetail?: (id: string) => void;
  isPast?: boolean;
  isJoined?: boolean;
};

function levelPillClass(level: ReturnType<typeof competitiveLabel>): string {
  if (level === 'Casual') return 'bg-white/10 text-cream';
  if (level === 'Competitive') return 'bg-brand-500/20 text-brand-400';
  return 'bg-sky-accent/15 text-sky-accent';
}

export function GameCard({
  game,
  onJoin,
  onLeave,
  onOpenDetail,
  isPast = false,
  isJoined = false,
}: GameCardProps) {
  const spotsRemaining = game.capacity - game.players.length;
  const isFull = spotsRemaining <= 0;
  const now = new Date();
  const startTime = new Date(game.startTime);
  const minsUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);
  const minPlayers = Math.max(2, Math.ceil(game.capacity * 0.4));
  const needsMorePlayers =
    !isPast &&
    !isFull &&
    game.players.length < minPlayers &&
    minsUntilStart > 0 &&
    minsUntilStart < 120;

  const joinDisabled = isPast || isJoined || isFull;

  const level = competitiveLabel(game.skillLevel);
  const address =
    locations[game.location]?.address ?? 'Northwestern campus, Evanston, IL';
  const title =
    game.note.trim().length > 0
      ? game.note.length > 48
        ? `${game.note.slice(0, 48)}…`
        : game.note
      : `${game.sport} at ${game.location}`;

  return (
    <article
      className={`flex flex-col space-y-3 rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-5 shadow-[0_24px_60px_rgba(2,8,18,0.3)] backdrop-blur-xl ${
        isPast ? 'opacity-55' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenDetail?.(game.id)}
          className="min-w-0 flex-1 rounded-xl text-left transition hover:bg-white/5"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {sportEmoji(game.sport)}
            </span>
            <span className="rounded-full bg-gradient-to-r from-brand-500/25 to-brand-400/20 px-3 py-1 text-xs font-bold text-brand-400 ring-1 ring-brand-400/30">
              {game.sport}
            </span>
          </span>
          <h3 className="mt-3 text-lg font-semibold text-cream">{title}</h3>
          <p className="mt-1 text-sm text-cream-muted">{game.location}</p>
          <p className="mt-0.5 text-xs text-cream-muted/80">{address}</p>
        </button>
      </div>

      <p className="text-sm font-medium text-brand-400">
        {formatGameTime(game.startTime)}
      </p>

      <div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${levelPillClass(level)}`}
        >
          {level}
        </span>
      </div>

      {needsMorePlayers && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-bold text-amber-200">
          ⚠️ Needs more players
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-cream">
          {game.players.length} / {game.capacity} joined
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all"
            style={{
              width: `${Math.min(100, (game.players.length / game.capacity) * 100)}%`,
            }}
          />
        </div>
      </div>

      {isJoined && !isPast ? (
        <Button
          variant="secondary"
          className="mt-auto w-full justify-center border-red-400/40 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15"
          onClick={(e) => {
            e.stopPropagation();
            onLeave(game.id);
          }}
        >
          Leave
        </Button>
      ) : (
        <Button
          variant="primary"
          className="mt-auto w-full justify-center"
          disabled={joinDisabled}
          onClick={(e) => {
            e.stopPropagation();
            onJoin(game.id);
          }}
        >
          {isPast ? 'Ended' : isFull ? 'Full' : 'Join'}
        </Button>
      )}
    </article>
  );
}
