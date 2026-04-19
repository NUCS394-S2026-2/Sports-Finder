import { locations } from '../data';
import { formatGameTime } from '../lib/datetime';
import { competitiveLabel, sportEmoji } from '../lib/sports';
import type { PickupGame } from '../types';
import { Button } from './ui/Button';

type SignedUpGameCardProps = {
  game: PickupGame;
  mapsUrl: (location: string) => string;
  isPast: boolean;
  isOrganizer: boolean;
  onOpenDetail: (id: string) => void;
  onLeave: (id: string) => void;
};

function organizerName(game: PickupGame): string {
  const organizer = game.organizer.trim().toLowerCase();
  const host = game.players.find((player) => player.email.toLowerCase() === organizer);
  if (host?.name) return host.name;
  const localPart = game.organizer.split('@')[0]?.trim();
  return localPart || 'Host';
}

function levelPillClass(level: ReturnType<typeof competitiveLabel>): string {
  if (level === 'Casual') return 'bg-white/10 text-cream';
  if (level === 'Competitive') return 'bg-brand-500/20 text-brand-400';
  return 'bg-sky-accent/15 text-sky-accent';
}

export function SignedUpGameCard({
  game,
  mapsUrl,
  isPast,
  isOrganizer,
  onOpenDetail,
  onLeave,
}: SignedUpGameCardProps) {
  const level = competitiveLabel(game.skillLevel);
  const address =
    locations[game.location]?.address ?? 'Northwestern campus, Evanston, IL';
  const title =
    game.note.trim().length > 0
      ? game.note.length > 56
        ? `${game.note.slice(0, 56)}…`
        : game.note
      : `${game.sport} at ${game.location}`;
  const hostName = organizerName(game);
  const statusLabel = isPast ? 'Past game' : 'Upcoming';
  const statusClass = isPast
    ? 'bg-white/10 text-cream-muted'
    : 'bg-brand-500/20 text-brand-400';

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-5 shadow-[0_24px_60px_rgba(2,8,18,0.3)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {sportEmoji(game.sport)}
            </span>
            <span className="rounded-full bg-gradient-to-r from-brand-500/25 to-brand-400/20 px-3 py-1 text-xs font-bold text-brand-400 ring-1 ring-brand-400/30">
              {game.sport}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-cream">{title}</h3>
          <p className="mt-1 text-sm text-cream-muted">{game.location}</p>
          <p className="mt-0.5 text-xs text-cream-muted/80">{address}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${levelPillClass(level)}`}
        >
          {level}
        </span>
      </div>

      <p className="text-sm font-medium text-brand-400">
        {formatGameTime(game.startTime)}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-cream-muted">
            Host
          </p>
          <p className="mt-1 text-sm font-semibold text-cream">{hostName}</p>
          {isOrganizer ? (
            <a
              href={`mailto:${game.organizer}`}
              className="mt-1 block break-all text-sm text-sky-accent underline-offset-2 hover:underline"
            >
              {game.organizer}
            </a>
          ) : null}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-cream-muted">
            Roster
          </p>
          <p className="mt-1 text-sm font-semibold text-cream">
            {game.players.length} / {game.capacity} players
          </p>
          <p className="mt-1 text-sm text-cream-muted">
            {game.players.length === game.capacity ? 'Full roster' : 'Spot still open'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-cream-muted">
            Role
          </p>
          <p className="mt-1 text-sm font-semibold text-cream">
            {isOrganizer ? 'You are the host' : 'You are signed up'}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-cream-muted">
            Where
          </p>
          <a
            href={mapsUrl(game.location)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-sm font-semibold text-sky-accent underline-offset-2 hover:underline"
          >
            Open in Google Maps
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cream">
          {game.ageRange}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cream">
          {game.gender}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cream">
          {game.requirements}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-cream-muted">{game.note}</p>

      <div className="mt-auto flex flex-wrap gap-3 pt-2">
        <Button
          variant="secondary"
          className="justify-center"
          onClick={() => onOpenDetail(game.id)}
        >
          View details
        </Button>
        {!isPast && !isOrganizer && (
          <Button
            variant="ghost"
            className="justify-center border-red-400/40 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15"
            onClick={() => onLeave(game.id)}
          >
            Leave game
          </Button>
        )}
      </div>
    </article>
  );
}
