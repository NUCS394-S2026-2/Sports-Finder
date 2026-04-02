import { useState } from 'react';

import { GameCard } from '../components/game-card';
import { useGames } from '../context/games-context';

export function GamesPage() {
  const { games } = useGames();
  const [selectedFilter, setSelectedFilter] = useState('All Sports');

  const sports = [
    'All Sports',
    'Basketball',
    'Soccer',
    'Skateboarding',
    'Tennis',
    'Volleyball',
  ];

  const filteredGames =
    selectedFilter === 'All Sports'
      ? games
      : games.filter((game) => game.sport === selectedFilter);

  return (
    <div className="space-y-6">
      {/* Header - Hide on desktop since it's in the top bar */}
      <div className="flex flex-col gap-3 lg:hidden">
        <h1 className="font-['Epilogue'] text-4xl font-extrabold tracking-tight uppercase text-foreground">
          Available Games
        </h1>
        <p className="text-muted-foreground">Join a game near you or host your own</p>
      </div>

      {/* Desktop Stats Bar */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4">
        <div className="bg-[#131313] p-4 rounded-2xl border border-[#262626]/50">
          <p className="text-muted-foreground text-sm mb-1">Total Games</p>
          <p className="font-['Epilogue'] text-3xl font-bold text-primary">
            {games.length}
          </p>
        </div>
        <div className="bg-[#131313] p-4 rounded-2xl border border-[#262626]/50">
          <p className="text-muted-foreground text-sm mb-1">Active Players</p>
          <p className="font-['Epilogue'] text-3xl font-bold text-primary">
            {games.reduce((sum, game) => sum + game.currentPlayers, 0)}
          </p>
        </div>
        <div className="bg-[#131313] p-4 rounded-2xl border border-[#262626]/50">
          <p className="text-muted-foreground text-sm mb-1">Available Spots</p>
          <p className="font-['Epilogue'] text-3xl font-bold text-primary">
            {games.reduce(
              (sum, game) => sum + (game.maxPlayers - game.currentPlayers),
              0,
            )}
          </p>
        </div>
        <div className="bg-[#131313] p-4 rounded-2xl border border-[#262626]/50">
          <p className="text-muted-foreground text-sm mb-1">Sports Available</p>
          <p className="font-['Epilogue'] text-3xl font-bold text-primary">
            {new Set(games.map((g) => g.sport)).size}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {sports.map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedFilter(sport)}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
              selectedFilter === sport
                ? 'bg-primary text-primary-foreground shadow-[0_4px_12px_rgba(255,143,111,0.2)]'
                : 'bg-[#262626] text-primary hover:bg-[#2c2c2c]'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Games Grid - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12 bg-[#131313] rounded-2xl border border-[#262626]/50">
          <p className="text-muted-foreground">
            {selectedFilter === 'All Sports'
              ? 'No games available yet. Be the first to host one!'
              : `No ${selectedFilter} games available. Try a different sport or host one!`}
          </p>
        </div>
      )}
    </div>
  );
}
