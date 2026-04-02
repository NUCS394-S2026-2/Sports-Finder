import {
  Calendar,
  ChevronRight,
  Clock,
  Dumbbell,
  MapPin,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { Game, useGames } from '../context/games-context';

interface GameCardProps {
  game: Game;
}

const sportIcons: Record<string, React.ReactNode> = {
  Basketball: '🏀',
  Soccer: '⚽',
  Skateboarding: '🛹',
  Tennis: '🎾',
  Volleyball: '🏐',
  Cycling: '🚴',
  Running: '🏃',
  Swimming: '🏊',
};

const levelColors = {
  Casual: 'bg-[#eda8ff]/10 text-[#eda8ff]',
  Intermediate: 'bg-primary/10 text-primary',
  Pro: 'bg-secondary/10 text-secondary',
};

export function GameCard({ game }: GameCardProps) {
  const { joinGame, leaveGame } = useGames();
  const [isJoined, setIsJoined] = useState(game.players.includes('You'));
  const isFull = game.currentPlayers >= game.maxPlayers;

  const handleJoinLeave = () => {
    if (isJoined) {
      leaveGame(game.id, 'You');
      setIsJoined(false);
    } else {
      if (!isFull) {
        joinGame(game.id, 'You');
        setIsJoined(true);
      }
    }
  };

  const spotsLeft = game.maxPlayers - game.currentPlayers;

  return (
    <div className="bg-[#131313] p-5 lg:p-6 rounded-2xl space-y-4 border border-[#262626]/50 hover:border-primary/20 transition-all hover:shadow-[0_8px_24px_rgba(255,143,111,0.08)] group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl lg:text-3xl shrink-0 group-hover:scale-105 transition-transform">
            {sportIcons[game.sport] || <Dumbbell className="w-6 h-6 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-['Epilogue'] text-lg lg:text-xl font-bold tracking-tight text-foreground truncate">
              {game.title}
            </h3>
            <span
              className={`inline-block mt-1 px-2 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase ${levelColors[game.competitiveLevel]}`}
            >
              {game.competitiveLevel}
            </span>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{game.location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{game.date}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>{game.time}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span>
            {game.currentPlayers}/{game.maxPlayers} players
          </span>
        </div>
      </div>

      {/* Notes */}
      {game.notes && (
        <p className="text-xs text-muted-foreground bg-[#1a1919] p-3 rounded-lg line-clamp-2">
          {game.notes}
        </p>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-2 bg-[#1a1919] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
            style={{ width: `${(game.currentPlayers / game.maxPlayers) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {spotsLeft > 0 ? (
              <>
                {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
              </>
            ) : (
              'Full'
            )}
          </span>
          {isJoined && (
            <div className="flex items-center gap-1 text-primary">
              <Zap className="w-3 h-3 fill-current" />
              <span className="font-semibold">Joined</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleJoinLeave}
        disabled={!isJoined && isFull}
        className={`w-full py-3 lg:py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all active:scale-[0.98] ${
          isJoined
            ? 'bg-[#262626] text-foreground hover:bg-[#2c2c2c] border border-primary/20'
            : isFull
              ? 'bg-[#1a1919] text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground shadow-[0_8px_16px_rgba(255,143,111,0.15)] hover:shadow-[0_12px_24px_rgba(255,143,111,0.2)]'
        }`}
      >
        {isJoined ? 'Leave Game' : isFull ? 'Game Full' : 'Join Game'}
      </button>
    </div>
  );
}
