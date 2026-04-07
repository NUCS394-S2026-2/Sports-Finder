import './App.css';

import { useEffect, useMemo, useState } from 'react';

import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { TagFilterGroup } from './components/TagFilterGroup';
import { Toolbar, type ViewName } from './components/Toolbar';
import { ageRanges, emptyDraft, genders, skillLevels } from './data';
import { formatGameTime, toLocalDateTimeValue } from './lib/datetime';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { GameDraft, PickupGame } from './types';

type TagValue<T extends string> = 'All' | T;

function App() {
  const [view, setView] = useState<ViewName>('home');
  const [games, setGames] = useState<PickupGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skillLevel: 'All' as TagValue<PickupGame['skillLevel']>,
    ageRange: 'All' as TagValue<PickupGame['ageRange']>,
    gender: 'All' as TagValue<PickupGame['gender']>,
  });
  const [draft, setDraft] = useState<GameDraft>({
    ...emptyDraft,
    startTime: toLocalDateTimeValue(new Date(Date.now() + 90 * 60 * 1000)),
  });
  const [activeGame, setActiveGame] = useState<PickupGame | null>(null);
  const [focusedGameId, setFocusedGameId] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const data = await fetchGames();
        setGames(data);
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  useEffect(() => {
    if (view !== 'find' || !focusedGameId) {
      return;
    }

    const id = `game-tile-${focusedGameId}`;
    const tile = document.getElementById(id);
    if (!tile) {
      return;
    }

    tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const clearTimer = window.setTimeout(() => setFocusedGameId(null), 2200);

    return () => window.clearTimeout(clearTimer);
  }, [view, focusedGameId, games]);

  function handleViewGame(gameId: string) {
    const targetGame = games.find((game) => game.id === gameId) ?? null;
    setView('find');
    setFocusedGameId(gameId);
    setActiveGame(targetGame);
  }

  const upcomingGames = useMemo(() => games.slice(0, 2), [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSkill =
        filters.skillLevel === 'All' || game.skillLevel === filters.skillLevel;
      const matchesAge = filters.ageRange === 'All' || game.ageRange === filters.ageRange;
      const matchesGender = filters.gender === 'All' || game.gender === filters.gender;

      return matchesSkill && matchesAge && matchesGender;
    });
  }, [filters, games]);

  async function handleJoinGame(id: string) {
    try {
      await joinGame(id);
      const updated = await fetchGames();
      setGames(updated);
    } catch (err) {
      console.error('Failed to join game:', err);
    }
  }

  async function handleCreateGame() {
    try {
      await createGame(draft);
      const updated = await fetchGames();
      setGames(updated);

      setDraft({
        ...emptyDraft,
        startTime: toLocalDateTimeValue(new Date(Date.now() + 120 * 60 * 1000)),
      });
      setView('find');
    } catch (err) {
      console.error('Failed to create game:', err);
    }
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="app-background" aria-hidden="true" />
        <Toolbar activeView={view} onNavigate={setView} />
        <section className="page-panel">
          <p>Loading games...</p>
        </section>
      </main>
    );
  }

  const homeSection = (
    <section className="page-panel hero-layout">
      <div className="hero-copy-card">
        <p className="eyebrow">Homepage</p>
        <h1>Find a pickup game without digging through group chats.</h1>
        <p className="hero-text">
          Sports Finder helps adults discover casual recreational sports nearby, join a
          roster that fits, and post a new game when the court or field needs one more
          player.
        </p>

        <div className="hero-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => setView('find')}
          >
            Find local games
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setView('create')}
          >
            Create a game
          </button>
        </div>
      </div>

      <div className="home-upcoming">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">Want to Join?</p>
            <h2>Upcoming Games</h2>
          </div>
          <p className="section-copy">
            Checkout the Find Local Games tab for more options.
          </p>
        </div>

        <div className="game-grid home-grid">
          {upcomingGames.map((game) => (
            <GameCard key={game.id} game={game} onJoin={handleJoinGame} />
          ))}
        </div>
      </div>
    </section>
  );

  const findSection = (
    <section className="page-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Find local games</p>
          <h2>Filter by the fit that matters</h2>
        </div>
        <p className="section-copy">
          Browse tiles, then narrow the list using skill level, age range, and gender
          tags.
        </p>
      </div>

      <div className="filter-stack">
        <TagFilterGroup
          label="Skill level"
          value={filters.skillLevel}
          options={['All', ...skillLevels]}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              skillLevel: value as TagValue<PickupGame['skillLevel']>,
            }))
          }
        />
        <TagFilterGroup
          label="Age range"
          value={filters.ageRange}
          options={['All', ...ageRanges]}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              ageRange: value as TagValue<PickupGame['ageRange']>,
            }))
          }
        />
        <TagFilterGroup
          label="Gender"
          value={filters.gender}
          options={['All', ...genders]}
          onChange={(value) =>
            setFilters((current) => ({
              ...current,
              gender: value as TagValue<PickupGame['gender']>,
            }))
          }
        />
      </div>

      <div className="game-grid">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onJoin={handleJoinGame}
            onOpen={setActiveGame}
            cardId={`game-tile-${game.id}`}
            highlighted={focusedGameId === game.id}
          />
        ))}
      </div>

      {activeGame ? (
        <div className="game-modal-backdrop">
          <button
            type="button"
            className="game-modal-dismiss"
            onClick={() => setActiveGame(null)}
            aria-label="Close game details"
          />
          <article
            className="game-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Game details"
          >
            <div className="game-card-top">
              <span className="sport-pill">{activeGame.sport}</span>
              <span
                className={
                  activeGame.capacity - activeGame.spotsFilled <= 0
                    ? 'status status-full'
                    : 'status'
                }
              >
                {activeGame.capacity - activeGame.spotsFilled <= 0
                  ? 'Full'
                  : `${activeGame.capacity - activeGame.spotsFilled} spots open`}
              </span>
            </div>

            <h2>{activeGame.location}</h2>
            <p className="game-time game-modal-time">
              {formatGameTime(activeGame.startTime)}
            </p>
            <p className="game-note game-modal-note">{activeGame.note}</p>

            <div className="tag-row" aria-label="Game tags">
              <span className="tag">{activeGame.skillLevel}</span>
              <span className="tag">Age {activeGame.ageRange}</span>
              <span className="tag">{activeGame.gender}</span>
            </div>

            <dl className="game-details">
              <div>
                <dt>Organizer</dt>
                <dd>{activeGame.organizer}</dd>
              </div>
              <div>
                <dt>Players</dt>
                <dd>
                  {activeGame.spotsFilled}/{activeGame.capacity}
                </dd>
              </div>
            </dl>

            <div className="form-actions">
              <button
                type="button"
                className="join-button"
                disabled={activeGame.capacity - activeGame.spotsFilled <= 0}
                onClick={async () => {
                  await handleJoinGame(activeGame.id);
                  setActiveGame(null);
                }}
              >
                {activeGame.capacity - activeGame.spotsFilled <= 0
                  ? 'Game full'
                  : 'Join game'}
              </button>
            </div>
          </article>
        </div>
      ) : null}

      {filteredGames.length === 0 ? (
        <div className="empty-state">
          <h3>No games match these filters.</h3>
          <p>Try relaxing one of the tag filters or add a new listing.</p>
        </div>
      ) : null}
    </section>
  );

  const createSection = (
    <section className="page-panel create-layout">
      <div className="section-header">
        <div>
          <p className="eyebrow">Create a game</p>
          <h2>Post a new pickup listing</h2>
        </div>
        <p className="section-copy">
          Fill out the form and the game will appear in the local games grid.
        </p>
      </div>

      <GameForm
        draft={draft}
        onChange={setDraft}
        onClose={() => setView('find')}
        onSubmit={handleCreateGame}
        games={games}
        onViewGame={handleViewGame}
      />
    </section>
  );

  const aboutSection = (
    <section className="page-panel about-layout">
      <div className="about-card">
        <p className="eyebrow">About</p>
        <h2>Who Are We?</h2>
        <p>
          We&apos;re a group of students and sports enthusiasts who believe that staying
          active shouldn&apos;t feel like a chore — or a challenge to figure out. Born out
          of a shared frustration with how hard it can be for adults to find local games,
          leagues, and courts, we built SportsFinder to make getting moving as easy as
          possible. Whether you&apos;re a seasoned athlete or just looking to try
          something new, we&apos;re here to connect you with the sports community right in
          your backyard.
        </p>
        <br></br>
        <h2>Our Mission</h2>
        <p>
          Our mission is to make recreational sports more accessible, welcoming, and
          easier to join for adults who want to stay active, meet people, and play without
          unnecessary barriers.
        </p>
        <br></br>
        <h2>Why This Exists</h2>
        <p>
          The idea comes from how hard it can be to turn casual interest into an actual
          game. Adults often want a low-friction way to find a court, fill a roster, and
          know they are joining a group that feels like a fit.
        </p>
      </div>
    </section>
  );

  const currentSection =
    view === 'home'
      ? homeSection
      : view === 'find'
        ? findSection
        : view === 'create'
          ? createSection
          : aboutSection;

  return (
    <main className="app-shell">
      <div className="app-background" aria-hidden="true" />
      <Toolbar activeView={view} onNavigate={setView} />
      {currentSection}
    </main>
  );
}

export default App;
