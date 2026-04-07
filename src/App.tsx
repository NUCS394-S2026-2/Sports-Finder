import './App.css';

import { useEffect, useMemo, useState } from 'react';

import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { TagFilterGroup } from './components/TagFilterGroup';
import { Toolbar, type ViewName } from './components/Toolbar';
import { emptyDraft, featuredSports, locations } from './data';
import { formatGameTime } from './lib/datetime';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { GameDraft, PickupGame, User } from './types';

function App() {
  const [view, setView] = useState<ViewName>('home');
  const [games, setGames] = useState<PickupGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [selectedGame, setSelectedGame] = useState<PickupGame | null>(null);
  const [pendingJoinId, setPendingJoinId] = useState<string | null>(null);
  const [showConflict, setShowConflict] = useState(false);
  const [conflictGame, setConflictGame] = useState<PickupGame | null>(null);
  const [filters, setFilters] = useState({
    sport: 'All' as 'All' | PickupGame['sport'],
    location: 'All' as 'All' | string,
    search: '',
  });
  const [draft, setDraft] = useState<GameDraft>(emptyDraft);

  useEffect(() => {
    const data = fetchGames();
    setGames(data);
    setLoading(false);
  }, []);

  const availableGames = useMemo(
    () =>
      games
        .filter((g) => g.players.length < g.capacity)
        .sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
    [games],
  );

  const hasCreatedGame = useMemo(
    () => games.some((g) => g.organizer === user?.email),
    [games, user],
  );

  const upcomingGames = useMemo(() => availableGames.slice(0, 4), [availableGames]);

  const filteredGames = useMemo(() => {
    return availableGames.filter((game) => {
      const matchesSport = filters.sport === 'All' || game.sport === filters.sport;
      const matchesLocation =
        filters.location === 'All' || game.location === filters.location;
      const matchesSearch =
        filters.search === '' ||
        game.location.toLowerCase().includes(filters.search.toLowerCase()) ||
        game.sport.toLowerCase().includes(filters.search.toLowerCase());

      return matchesSport && matchesLocation && matchesSearch;
    });
  }, [filters, availableGames]);

  function handleLogin() {
    if (loginName && loginEmail) {
      setUser({ name: loginName, email: loginEmail });
      setShowLogin(false);
      setLoginName('');
      setLoginEmail('');
      if (pendingJoinId) {
        const updated = joinGame(
          pendingJoinId,
          { name: loginName, email: loginEmail },
          games,
        );
        setGames(updated);
        setPendingJoinId(null);
      }
    }
  }

  function handleLogout() {
    setUser(null);
  }

  function handleJoinGame(id: string) {
    if (!user) {
      setPendingJoinId(id);
      setShowLogin(true);
      return;
    }
    const game = games.find((g) => g.id === id);
    if (!game) return;
    const updated = joinGame(id, user, games);
    setGames(updated);
    setSelectedGame(updated.find((g) => g.id === id) || null);
    setView('game');
  }

  function handleCreateGame() {
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (games.some((g) => g.organizer === user.email)) {
      alert('You have already created a game.');
      return;
    }
    const draftWithOrganizer = { ...draft, organizer: user.email };
    const result = createGame(draftWithOrganizer, games);
    if (result.conflict) {
      setConflictGame(result.conflict);
      setShowConflict(true);
      return;
    }
    if (result.game) {
      setGames([...games, result.game]);
      setDraft(emptyDraft);
      setView('find');
    }
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="app-background" aria-hidden="true" />
        <Toolbar
          activeView={view}
          onNavigate={setView}
          user={user}
          onLogout={handleLogout}
        />
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
          Play Local helps adults discover casual recreational sports nearby, join a
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
            <p className="eyebrow">Upcoming games</p>
            <h2>Tonight and tomorrow</h2>
          </div>
          <p className="section-copy">
            A couple of active games to show what is happening right now.
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
          <h2>Browse available games</h2>
        </div>
        <p className="section-copy">
          Search and filter games by sport, location, and more.
        </p>
      </div>

      <div className="filter-stack">
        <input
          type="text"
          placeholder="Search by location or sport"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <TagFilterGroup<'All' | PickupGame['sport']>
          label="Sport"
          value={filters.sport}
          options={['All', ...featuredSports] as Array<'All' | PickupGame['sport']>}
          onChange={(value) => setFilters((f) => ({ ...f, sport: value }))}
        />
        <label>
          Location
          <select
            value={filters.location}
            onChange={(event) =>
              setFilters({ ...filters, location: event.target.value as 'All' | string })
            }
          >
            <option value="All">All locations</option>
            {Object.keys(locations).map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="game-grid">
        {filteredGames.map((game) => (
          <GameCard key={game.id} game={game} onJoin={handleJoinGame} />
        ))}
      </div>

      {filteredGames.length === 0 ? (
        <div className="empty-state">
          <h3>No games match these filters.</h3>
          <p>Try relaxing the filters or create a new game.</p>
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
        <p className="section-copy">Fill out the form to create a new game.</p>
      </div>

      {user ? (
        hasCreatedGame ? (
          <div>
            <p>You have already created a game. You cannot create multiple games.</p>
          </div>
        ) : (
          <GameForm
            draft={draft}
            onChange={setDraft}
            onClose={() => setView('find')}
            onSubmit={handleCreateGame}
            sports={featuredSports}
            games={games}
          />
        )
      ) : (
        <div>
          <p>You must be logged in to create a game.</p>
          <button onClick={() => setShowLogin(true)}>Login</button>
        </div>
      )}
    </section>
  );

  const aboutSection = (
    <section className="page-panel about-layout">
      <div className="about-card">
        <p className="eyebrow">About</p>
        <h2>Why this exists</h2>
        <p>
          The idea comes from how hard it can be to turn casual interest into an actual
          game. Adults often want a low-friction way to find a court, fill a roster, and
          know they are joining a group that feels like a fit.
        </p>
        <p>
          Our mission is to make recreational sports more accessible, welcoming, and
          easier to join for adults who want to stay active, meet people, and play without
          unnecessary barriers.
        </p>
      </div>
    </section>
  );

  const gameSection = selectedGame ? (
    <section className="page-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Game Details</p>
          <h2>
            You&apos;ve joined {selectedGame.sport} at {selectedGame.location}
          </h2>
        </div>
      </div>
      <div className="game-details-card">
        <p>
          <strong>Time:</strong> {formatGameTime(selectedGame.startTime)} -{' '}
          {formatGameTime(selectedGame.endTime)}
        </p>
        <p>
          <strong>Location:</strong> {selectedGame.location}
        </p>
        <p>
          <strong>Skill level:</strong> {selectedGame.skillLevel}
        </p>
        <p>
          <strong>Age range:</strong> {selectedGame.ageRange}
        </p>
        <p>
          <strong>Gender:</strong> {selectedGame.gender}
        </p>
        <p>
          <strong>Players:</strong>
        </p>
        <ul>
          {selectedGame.players.map((p) => (
            <li key={p.email}>{p.name}</li>
          ))}
        </ul>
        <p>
          <strong>Host Email:</strong> {selectedGame.organizer}
        </p>
        <button onClick={() => setView('find')}>Back to Games</button>
      </div>
    </section>
  ) : null;

  const currentSection =
    view === 'home'
      ? homeSection
      : view === 'find'
        ? findSection
        : view === 'create'
          ? createSection
          : view === 'game'
            ? gameSection
            : aboutSection;

  return (
    <main className="app-shell">
      <div className="app-background" aria-hidden="true" />
      <Toolbar
        activeView={view}
        onNavigate={setView}
        user={user}
        onLogout={handleLogout}
      />
      {currentSection}
      {showLogin && (
        <div className="modal">
          <div className="modal-content">
            <h3>Login</h3>
            <input
              type="text"
              placeholder="Name"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            <button onClick={() => setShowLogin(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showConflict && conflictGame && (
        <div className="modal">
          <div className="modal-content">
            <h3>Game Conflict</h3>
            <p>There&apos;s already a similar game. Would you like to join it instead?</p>
            <div className="conflict-game">
              <p>
                <strong>Sport:</strong> {conflictGame.sport}
              </p>
              <p>
                <strong>Location:</strong> {conflictGame.location}
              </p>
              <p>
                <strong>Time:</strong> {formatGameTime(conflictGame.startTime)} -{' '}
                {formatGameTime(conflictGame.endTime)}
              </p>
              <p>
                <strong>Players:</strong> {conflictGame.players.length}/
                {conflictGame.capacity}
              </p>
            </div>
            <button
              onClick={() => {
                handleJoinGame(conflictGame.id);
                setShowConflict(false);
              }}
            >
              Join This Game
            </button>
            <button onClick={() => setShowConflict(false)}>Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
