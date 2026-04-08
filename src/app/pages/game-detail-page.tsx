import { Calendar, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { PrimaryButton } from '../components/ui/app-buttons';
import { AppCard } from '../components/ui/app-card';
import { useAuth } from '../context/auth-context';
import { useGames } from '../context/games-context';

const sportEmoji: Record<string, string> = {
  Tennis: '🎾',
  Soccer: '⚽',
  Frisbee: '🥏',
};

const levelClass: Record<string, string> = {
  Casual: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-900 border border-amber-200',
  Competitive: 'bg-red-50 text-red-800 border border-red-200',
};

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { games, joinGame, leaveGame, cancelGame } = useGames();
  const { user } = useAuth();
  const game = games.find((g) => g.id === gameId);
  const playerName = user?.displayName ?? 'You';

  if (!game) {
    return (
      <div className="app-section text-center">
        <p className="text-text-secondary">Game not found.</p>
        <Link to="/games" className="mt-4 inline-block font-semibold text-brand">
          Back to games
        </Link>
      </div>
    );
  }

  const isFull = game.currentPlayers >= game.maxPlayers;
  const isJoined = game.players.includes(playerName) || game.players.includes('You');
  const isHost = !!user && user.displayName === game.hostName;

  const handleJoin = async () => {
    if (!user) {
      navigate('/sign-in?next=' + encodeURIComponent(`/games/${game.id}`));
      return;
    }
    if (game.cancelled && !isJoined) {
      toast.error(
        'This game was cancelled — not enough players signed up before start time.',
      );
      return;
    }
    if (isJoined) {
      await leaveGame(game.id, playerName);
      if (game.players.includes('You')) await leaveGame(game.id, 'You');
    } else if (!isFull) {
      const joinedOk = await joinGame(game.id, playerName);
      if (!joinedOk) {
        toast.error(
          "You're already in another game that overlaps with this time. Leave that game first or pick a different time.",
        );
      }
    }
  };

  const handleCancelByHost = async () => {
    if (!isHost || game.cancelled) return;
    await cancelGame(game.id);
    toast.success('Game cancelled.');
    navigate('/games');
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="pb-28 lg:pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10 lg:px-16 lg:py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium text-text-secondary hover:text-brand"
        >
          ← Back
        </button>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-4xl" aria-hidden>
                {sportEmoji[game.sport] ?? '🏟️'}
              </span>
              <span className="rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white">
                {game.sport}
              </span>
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-text-secondary">
                {game.location}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">
              {game.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand">
                {initials(game.hostName)}
              </div>
              <span>
                Hosted by{' '}
                <span className="font-semibold text-text-primary">{game.hostName}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Calendar className="h-4 w-4 text-brand" />
                <span className="font-medium text-text-primary">{game.date}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="h-4 w-4 text-brand" />
                <span className="font-medium text-text-primary">
                  {game.time}
                  {game.endTime ? ` – ${game.endTime}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <MapPin className="h-4 w-4 shrink-0 text-brand" />
                <span>
                  {game.location}
                  {game.address ? ` · ${game.address}` : ''}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelClass[game.competitiveLevel]}`}
              >
                {game.competitiveLevel}
              </span>
              <span className="inline-block rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-text-secondary">
                {game.gender}
              </span>
            </div>
            {game.notes ? (
              <p className="text-base leading-relaxed text-text-primary">{game.notes}</p>
            ) : null}
            {game.cancelled ? (
              <div className="rounded-xl border border-gray-200 bg-gray-100 p-4 text-sm font-medium text-text-primary">
                This game was automatically cancelled: not enough players had joined when
                the 30-minute window before start began.
              </div>
            ) : (
              <p className="text-sm italic text-text-muted">
                If the roster is still below the minimum 30 minutes before start, this
                game will be cancelled automatically.
              </p>
            )}
          </div>

          <div className="lg:col-span-1">
            <AppCard className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold text-text-primary">Players</p>
              <div className="mt-3 flex flex-row-reverse justify-end pl-2 [&>*]:-ml-2">
                {game.players.length > 8 ? (
                  <div className="relative z-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-semibold text-text-secondary">
                    +{game.players.length - 8}
                  </div>
                ) : null}
                {[...game.players.slice(0, 8)].reverse().map((p, i) => (
                  <div
                    key={`${p}-${i}`}
                    className="relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-brand-light text-xs font-bold text-brand"
                    title={p}
                  >
                    {initials(p)}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-lg font-bold text-text-primary">
                {game.currentPlayers} / {game.maxPlayers} players
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Host confirmed court reservation</span>
              </div>
              <PrimaryButton
                className="mt-6 hidden min-h-[48px] w-full lg:inline-flex lg:items-center lg:justify-center"
                onClick={handleJoin}
                disabled={!isJoined && (isFull || !!game.cancelled)}
              >
                {!user
                  ? 'Sign in to join'
                  : isJoined
                    ? 'Leave game'
                    : game.cancelled
                      ? 'Cancelled'
                      : isFull
                        ? 'Game full'
                        : 'Join Game'}
              </PrimaryButton>
              {isHost && !game.cancelled ? (
                <button
                  type="button"
                  className="mt-3 hidden w-full text-sm font-medium text-red-600 hover:text-red-700 lg:block"
                  onClick={() => void handleCancelByHost()}
                >
                  Cancel this game
                </button>
              ) : null}
            </AppCard>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-4 lg:hidden">
        <PrimaryButton
          className="min-h-[48px] w-full"
          onClick={handleJoin}
          disabled={!isJoined && (isFull || !!game.cancelled)}
        >
          {!user
            ? 'Sign in to join'
            : isJoined
              ? 'Leave game'
              : game.cancelled
                ? 'Cancelled'
                : isFull
                  ? 'Game full'
                  : 'Join Game'}
        </PrimaryButton>
        {isHost && !game.cancelled ? (
          <button
            type="button"
            className="mt-2 w-full text-sm font-medium text-red-600 hover:text-red-700"
            onClick={() => void handleCancelByHost()}
          >
            Cancel this game
          </button>
        ) : null}
      </div>
    </div>
  );
}
