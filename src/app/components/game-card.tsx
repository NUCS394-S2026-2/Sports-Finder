import { Calendar, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useAuth } from '../context/auth-context';
import { Game, useGames } from '../context/games-context';
import { PrimaryButton } from './ui/app-buttons';

interface GameCardProps {
  game: Game;
}

const sportIcons: Record<string, string> = {
  Basketball: '🏀',
  Soccer: '⚽',
  Skateboarding: '🛹',
  Tennis: '🎾',
  Volleyball: '🏐',
  Cycling: '🚴',
  Running: '🏃',
  Swimming: '🏊',
  Frisbee: '🥏',
};

const levelStyles: Record<Game['competitiveLevel'], string> = {
  Casual: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-900 border border-amber-200',
  Competitive: 'bg-red-50 text-red-800 border border-red-200',
};

export function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();
  const { joinGame, leaveGame } = useGames();
  const { user } = useAuth();
  const playerName = user?.displayName ?? 'You';

  const [isJoined, setIsJoined] = useState(
    () => game.players.includes(playerName) || game.players.includes('You'),
  );

  useEffect(() => {
    setIsJoined(game.players.includes(playerName) || game.players.includes('You'));
  }, [game.id, game.players, playerName]);

  const isFull = game.currentPlayers >= game.maxPlayers;
  const needsPlayers = !game.cancelled && game.currentPlayers < game.minPlayers;

  const handleJoinLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/sign-in?next=${encodeURIComponent(`/games/${game.id}`)}`);
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
      setIsJoined(false);
    } else if (!isFull) {
      const joinedOk = await joinGame(game.id, playerName);
      if (!joinedOk) {
        toast.error(
          "You're already in another game that overlaps with this time. Leave that game first or pick a different time.",
        );
        return;
      }
      setIsJoined(true);
      navigate(`/games/${game.id}`);
    }
  };

  const pct = Math.min(100, Math.round((game.currentPlayers / game.maxPlayers) * 100));

  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] ${game.cancelled ? 'opacity-70' : ''}`}
    >
      <Link
        to={`/games/${game.id}`}
        className="block space-y-3 rounded-t-2xl p-5 pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden>
            {sportIcons[game.sport] ?? '🏟️'}
          </span>
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">
              {game.sport}
            </span>
            <h3 className="mt-2 text-lg font-semibold text-text-primary">{game.title}</h3>
            <p className="mt-1 text-sm text-text-secondary">
              {game.location}
              {game.address ? ` · ${game.address}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-text-primary">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Calendar className="h-4 w-4 text-brand" />
            {game.date}
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <Clock className="h-4 w-4 text-brand" />
            {game.time}
            {game.endTime ? ` – ${game.endTime}` : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {game.cancelled ? (
            <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-text-primary">
              Cancelled
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${levelStyles[game.competitiveLevel]}`}
          >
            {game.competitiveLevel}
          </span>
          <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-text-secondary">
            {game.gender}
          </span>
          {needsPlayers ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
              ⚠️ Needs more players
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">
            {game.currentPlayers} / {game.maxPlayers} joined
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Link>

      <div className="border-t border-gray-50 px-5 pb-5 pt-3">
        <PrimaryButton
          type="button"
          className="min-h-[44px] w-full"
          onClick={handleJoinLeave}
          disabled={user ? !isJoined && (isFull || !!game.cancelled) : false}
        >
          {!user
            ? 'Join'
            : isJoined
              ? 'Leave'
              : game.cancelled
                ? 'Cancelled'
                : isFull
                  ? 'Full'
                  : 'Join'}
        </PrimaryButton>
      </div>
    </div>
  );
}
