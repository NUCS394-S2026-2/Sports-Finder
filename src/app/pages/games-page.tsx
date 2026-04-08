import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { GameCard } from '../components/game-card';
import { useAuth } from '../context/auth-context';
import { useGames } from '../context/games-context';

const FILTER_PILLS = ['All', 'Tennis', 'Soccer', 'Frisbee'] as const;

export function GamesPage() {
  const { games, isGamesLoading } = useGames();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof FILTER_PILLS)[number]>('All');
  const [query, setQuery] = useState('');

  const filteredGames = useMemo(() => {
    let list = games.filter((game) => !game.cancelled);
    if (selectedFilter !== 'All') {
      list = list.filter((game) => game.sport === selectedFilter);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.location.toLowerCase().includes(q) ||
          g.sport.toLowerCase().includes(q),
      );
    }
    return list;
  }, [games, selectedFilter, query]);

  return (
    <div className="space-y-8 lg:space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Hey, {user?.displayName?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="mt-1 text-text-secondary">Find a game that fits your afternoon.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by sport, court, or title…"
          className="app-input pl-11"
          aria-label="Search games"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTER_PILLS.map((sport) => {
          const active = selectedFilter === sport;
          return (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedFilter(sport)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border border-brand bg-brand text-white'
                  : 'border border-gray-200 text-text-secondary hover:border-brand'
              }`}
            >
              {sport === 'All' ? 'All sports' : sport}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {isGamesLoading ? (
        <div className="app-card py-16 text-center text-text-secondary">
          Loading games from database...
        </div>
      ) : null}

      {!isGamesLoading && filteredGames.length === 0 ? (
        <div className="app-card py-16 text-center text-text-secondary">
          {selectedFilter === 'All' && !query
            ? 'No games available yet. Host one from the tab below.'
            : 'No games match your filters — try another sport or search.'}
        </div>
      ) : null}
    </div>
  );
}
