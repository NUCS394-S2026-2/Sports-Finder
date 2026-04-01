import './App.css';

import { useMemo, useState } from 'react';

import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { Hero } from './components/Hero';
import { SportFilters } from './components/SportFilters';
import { emptyDraft, featuredSports, initialGames } from './data';
import { toLocalDateTimeValue } from './lib/datetime';
import type { GameDraft, PickupGame, SportFilter } from './types';

function App() {
  const [games, setGames] = useState<PickupGame[]>(initialGames);
  const [activeSport, setActiveSport] = useState<SportFilter>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<GameDraft>(() => ({
    ...emptyDraft,
    startTime: toLocalDateTimeValue(new Date(Date.now() + 90 * 60 * 1000)),
  }));

  const visibleGames = useMemo(() => {
    if (activeSport === 'All') {
      return games;
    }

    return games.filter((game) => game.sport === activeSport);
  }, [activeSport, games]);

  const totalOpenSpots = games.reduce(
    (sum, game) => sum + (game.capacity - game.spotsFilled),
    0,
  );

  function handleJoinGame(id: number) {
    setGames((currentGames) =>
      currentGames.map((game) => {
        if (game.id !== id || game.spotsFilled >= game.capacity) {
          return game;
        }

        return {
          ...game,
          spotsFilled: game.spotsFilled + 1,
        };
      }),
    );
  }

  function handleCreateGame() {
    const nextGame: PickupGame = {
      id: Date.now(),
      sport: draft.sport.trim() || 'Basketball',
      location: draft.location.trim(),
      startTime: draft.startTime,
      capacity: Math.max(2, Math.round(draft.capacity)),
      spotsFilled: 0,
      organizer: draft.organizer.trim(),
      note: draft.note.trim() || 'Bring your gear and show up five minutes early.',
    };

    setGames((currentGames) => [nextGame, ...currentGames]);
    setDraft({
      ...emptyDraft,
      sport: draft.sport,
      startTime: toLocalDateTimeValue(new Date(Date.now() + 120 * 60 * 1000)),
    });
    setIsFormOpen(false);
    setActiveSport('All');
  }

  return (
    <main className="app-shell">
      <div className="app-background" aria-hidden="true" />

      <Hero
        onCreateGame={() => setIsFormOpen((current) => !current)}
        openSpots={totalOpenSpots}
        sportsCount={featuredSports.length}
        totalGames={games.length}
      />

      <section className="content-grid">
        <div className="feed-column">
          <div className="section-header">
            <div>
              <p className="eyebrow">Browse nearby</p>
              <h2 id="games">Upcoming pickup games</h2>
            </div>
            <p className="section-copy">
              Join a game that fits your schedule, or filter by sport to narrow the list.
            </p>
          </div>

          <SportFilters
            activeSport={activeSport}
            onSelectSport={(sport) => setActiveSport(sport)}
            sports={['All', ...featuredSports]}
          />

          <div className="game-grid">
            {visibleGames.map((game) => (
              <GameCard key={game.id} game={game} onJoin={handleJoinGame} />
            ))}
          </div>

          {visibleGames.length === 0 ? (
            <div className="empty-state">
              <h3>No games match this filter.</h3>
              <p>Try a different sport or create the first listing for this category.</p>
            </div>
          ) : null}
        </div>

        <aside className="sidebar-column">
          {isFormOpen ? (
            <GameForm
              draft={draft}
              onChange={(nextDraft) => setDraft(nextDraft)}
              onClose={() => setIsFormOpen(false)}
              onSubmit={handleCreateGame}
              sports={featuredSports}
            />
          ) : (
            <section className="form-card form-closed" aria-label="Create a pickup game">
              <p className="eyebrow">Create listing</p>
              <h2>Post a new game when your roster needs one more.</h2>
              <p>Add the sport, location, time, and how many players you still need.</p>
              <button
                className="primary-button"
                onClick={() => setIsFormOpen(true)}
                type="button"
              >
                Open form
              </button>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}

export default App;
