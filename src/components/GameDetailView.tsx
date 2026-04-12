import { locations } from '../data';
import { formatGameTime } from '../lib/datetime';
import { competitiveLabel, sportEmoji } from '../lib/sports';
import type { PickupGame } from '../types';
import { Button } from './ui/Button';

type GameDetailViewProps = {
  game: PickupGame;
  mapsUrl: (location: string) => string;
  isJoined: boolean;
  isPast: boolean;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onBack: () => void;
};

function organizerName(game: PickupGame): string {
  const host = game.players.find((p) => p.email === game.organizer);
  return host?.name ?? game.organizer.split('@')[0];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function GameDetailView({
  game,
  mapsUrl,
  isJoined,
  isPast,
  onJoin,
  onLeave,
  onBack,
}: GameDetailViewProps) {
  const level = competitiveLabel(game.skillLevel);
  const address =
    locations[game.location]?.address ?? 'Northwestern campus, Evanston, IL';
  const spotsRemaining = game.capacity - game.players.length;
  const isFull = spotsRemaining <= 0;
  const joinDisabled = isPast || isJoined || isFull;
  const joinLabel = isPast ? 'Ended' : isFull ? 'Full' : 'Join Game';

  const leaveOnDark =
    'w-full justify-center border-red-400/40 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15';
  const leaveOnLight =
    'w-full justify-center border border-gray-300 bg-gray-100 font-semibold text-gray-900 hover:bg-gray-200';

  const title =
    game.note.trim().length > 0 ? game.note : `${game.sport} pickup · ${game.location}`;

  return (
    <div className="pb-36 md:pb-12">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm font-semibold text-brand-400 hover:underline"
      >
        ← Back to games
      </button>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <h1 className="text-3xl font-black tracking-tight text-cream sm:text-4xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {sportEmoji(game.sport)}
            </span>
            <span className="rounded-full bg-gradient-to-r from-brand-500/25 to-brand-400/20 px-4 py-1.5 text-sm font-bold text-brand-400 ring-1 ring-brand-400/30">
              {game.sport}
            </span>
            <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-cream">
              {game.location}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-400 text-sm font-extrabold text-ink">
              {initials(organizerName(game))}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cream-muted">
                Hosted by
              </p>
              <p className="text-lg font-bold text-cream">{organizerName(game)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-cream-muted">When</p>
            <p className="mt-1 text-lg font-bold text-brand-400">
              {formatGameTime(game.startTime)} – {formatGameTime(game.endTime)}
            </p>
          </div>

          <div>
            <span className="inline-flex rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-cream">
              {level}
            </span>
          </div>

          <div className="space-y-3 text-cream-muted">
            <p className="text-base leading-relaxed text-cream/90">{game.note}</p>
            {game.requirements && (
              <p className="text-sm">
                <span className="font-bold text-cream">Bring / notes:</span>{' '}
                {game.requirements}
              </p>
            )}
            <p className="text-sm">
              <span className="font-bold text-cream">Where:</span>{' '}
              <a
                href={mapsUrl(game.location)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sky-accent underline-offset-2 hover:underline"
              >
                {address}
              </a>
            </p>
          </div>

          <p className="text-sm italic text-cream-muted">
            This game will be cancelled if minimum players aren&apos;t reached 30 minutes
            before start.
          </p>

          <div className="hidden md:block xl:hidden">
            {isJoined && !isPast ? (
              <Button
                variant="secondary"
                className={`py-3.5 ${leaveOnDark}`}
                onClick={() => onLeave(game.id)}
              >
                Leave game
              </Button>
            ) : (
              <Button
                variant="primary"
                className="w-full justify-center py-3.5"
                disabled={joinDisabled}
                onClick={() => onJoin(game.id)}
              >
                {joinLabel}
              </Button>
            )}
          </div>
        </div>

        <aside className="xl:col-span-1">
          <div className="space-y-6 rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-6 shadow-[0_24px_60px_rgba(2,8,18,0.3)] backdrop-blur-xl xl:sticky xl:top-24">
            <div>
              <p className="text-sm font-semibold text-cream-muted">Roster</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {game.players.map((p) => (
                  <span
                    key={p.email}
                    title={p.name}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-extrabold text-cream"
                  >
                    {initials(p.name)}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-lg font-bold text-cream">
                {game.players.length} / {game.capacity} players
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
              ✓ Host confirmed court reservation
            </div>

            {isJoined && !isPast ? (
              <Button
                variant="secondary"
                className={`hidden w-full justify-center py-3.5 xl:flex ${leaveOnDark}`}
                onClick={() => onLeave(game.id)}
              >
                Leave game
              </Button>
            ) : (
              <Button
                variant="primary"
                className="hidden w-full justify-center py-3.5 xl:flex"
                disabled={joinDisabled}
                onClick={() => onJoin(game.id)}
              >
                {joinLabel}
              </Button>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-50 border-t border-white/12 bg-white p-4 shadow-[0_-8px_30px_rgba(9,19,31,0.08)] md:hidden">
        {isJoined && !isPast ? (
          <Button
            variant="secondary"
            className={`py-3.5 ${leaveOnLight}`}
            onClick={() => onLeave(game.id)}
          >
            Leave game
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full justify-center py-3.5"
            disabled={joinDisabled}
            onClick={() => onJoin(game.id)}
          >
            {joinLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
