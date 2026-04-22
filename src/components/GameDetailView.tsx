import { useEffect, useRef } from 'react';

import { locations } from '../data';
import { formatGameTime } from '../lib/datetime';
import { competitiveLabel, sportEmoji } from '../lib/sports';
import type { PickupGame } from '../types';
import { GameChat } from './GameChat';
import { Button } from './ui/Button';

type ChatUser = {
  uid: string;
  name: string;
  email: string;
};

type GameDetailViewProps = {
  game: PickupGame;
  mapsUrl: (location: string) => string;
  isJoined: boolean;
  isPast: boolean;
  isOrganizer: boolean;
  currentUser?: ChatUser | null;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onCancel: (id: string) => void;
  onBack: () => void;
  /** When true, smoothly scrolls to the chat section after render. */
  scrollToChat?: boolean;
};

function organizerName(game: PickupGame): string {
  const norm = game.organizer.trim().toLowerCase();
  const host = game.players.find((p) => p.email.toLowerCase() === norm);
  return host?.name ?? game.organizer.split('@')[0] ?? 'Host';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function playersSortedForDisplay(game: PickupGame): PickupGame['players'] {
  const organizerNorm = game.organizer.trim().toLowerCase();
  return [...game.players].sort((a, b) => {
    const aHost = a.email.toLowerCase() === organizerNorm;
    const bHost = b.email.toLowerCase() === organizerNorm;
    if (aHost !== bHost) return aHost ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

export function GameDetailView({
  game,
  mapsUrl,
  isJoined,
  isPast,
  isOrganizer,
  currentUser,
  onJoin,
  onLeave,
  onCancel,
  onBack,
  scrollToChat = false,
}: GameDetailViewProps) {
  const chatSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToChat) return;
    const timer = setTimeout(() => {
      chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(timer);
  }, [scrollToChat]);

  const level = competitiveLabel(game.skillLevel);
  const address =
    locations[game.location]?.address ?? 'Northwestern campus, Evanston, IL';
  const spotsRemaining = game.capacity - game.players.length;
  const isFull = spotsRemaining <= 0;
  const joinDisabled = isPast || isJoined || isFull;
  const joinLabel = isPast ? 'Ended' : isFull ? 'Full' : 'Join Game';

  const leaveOnDark =
    'w-full justify-center border-red-400/40 bg-red-500/10 text-red-200 hover:border-red-400/60 hover:bg-red-500/15';
  const cancelOnDark =
    'w-full justify-center border-amber-400/40 bg-amber-500/10 text-amber-100 hover:border-amber-400/60 hover:bg-amber-500/15';

  const title =
    game.note.trim().length > 0 ? game.note : `${game.sport} pickup · ${game.location}`;

  return (
    <div className="pb-8 md:pb-12">
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
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-cream-muted">
                Hosted by
              </p>
              <p className="text-lg font-bold text-cream">{organizerName(game)}</p>
              {isOrganizer ? (
                <p className="mt-2 text-sm text-cream-muted">
                  <span className="font-semibold text-cream-muted">Contact</span>{' '}
                  <a
                    href={`mailto:${game.organizer}`}
                    className="break-all font-semibold text-sky-accent underline-offset-2 hover:underline"
                  >
                    {game.organizer}
                  </a>
                </p>
              ) : null}
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

          <section
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
            aria-labelledby="game-detail-roster-heading"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="game-detail-roster-heading"
                className="text-lg font-bold tracking-tight text-cream"
              >
                Who&apos;s coming
              </h2>
              <p className="text-sm font-semibold text-cream-muted">
                {game.players.length} / {game.capacity} players
              </p>
            </div>
            {game.players.length === 0 ? (
              <p className="mt-3 text-sm text-cream-muted">
                No one has joined yet — be the first.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {playersSortedForDisplay(game).map((p) => {
                  const isHost =
                    p.email.toLowerCase() === game.organizer.trim().toLowerCase();
                  return (
                    <li key={p.email}>
                      <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-extrabold text-cream"
                          aria-hidden
                        >
                          {initials(p.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-cream">{p.name}</span>
                            {isHost ? (
                              <span className="rounded-full bg-gradient-to-r from-brand-500/30 to-brand-400/25 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-300 ring-1 ring-brand-400/35">
                                Host
                              </span>
                            ) : null}
                          </div>
                          {isOrganizer ? (
                            <p className="mt-1 text-sm text-cream-muted">
                              <a
                                href={`mailto:${p.email}`}
                                className="break-all font-semibold text-sky-accent underline-offset-2 hover:underline"
                              >
                                {p.email}
                              </a>
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="text-sm italic text-cream-muted">
            This game will be cancelled if minimum players aren&apos;t reached 30 minutes
            before start.
          </p>

          <div ref={chatSectionRef}>
            {(isJoined || isOrganizer) && (
              <GameChat gameId={game.id} currentUser={currentUser ?? null} />
            )}
          </div>

          <div className="xl:hidden">
            {isOrganizer && !isPast ? (
              <Button
                variant="secondary"
                className={`py-3.5 ${cancelOnDark}`}
                onClick={() => onCancel(game.id)}
              >
                Cancel game
              </Button>
            ) : isJoined && !isPast ? (
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

            <div className="hidden xl:block">
              {isOrganizer && !isPast ? (
                <Button
                  variant="secondary"
                  className={`w-full justify-center py-3.5 ${cancelOnDark}`}
                  onClick={() => onCancel(game.id)}
                >
                  Cancel game
                </Button>
              ) : isJoined && !isPast ? (
                <Button
                  variant="secondary"
                  className={`w-full justify-center py-3.5 ${leaveOnDark}`}
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
        </aside>
      </div>
    </div>
  );
}
