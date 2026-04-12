import './App.css';

import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { TagFilterGroup } from './components/TagFilterGroup';
import { Toolbar, type ViewName } from './components/Toolbar';
import { emptyDraft, featuredSports, genders, locations, skillLevels } from './data';
import { formatGameTime } from './lib/datetime';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { GameDraft, PickupGame, User } from './types';

type SortOption = 'date' | 'spots-asc' | 'spots-desc';
type TagValue<T extends string> = 'All' | T;

function App() {
  const [view, setView] = useState<ViewName>('home');
  const [games, setGames] = useState<PickupGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Login modal state
  const [showLogin, setShowLogin] = useState(false);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [pendingJoinId, setPendingJoinId] = useState<string | null>(null);

  // Post-join modal
  const [joinedGame, setJoinedGame] = useState<PickupGame | null>(null);

  // Conflict modal
  const [conflictGame, setConflictGame] = useState<PickupGame | null>(null);

  // Find page filters
  const [sportFilter, setSportFilter] = useState<TagValue<PickupGame['sport']>>('All');
  const [skillFilter, setSkillFilter] = useState<TagValue<PickupGame['skillLevel']>>('All');
  const [genderFilter, setGenderFilter] = useState<TagValue<PickupGame['gender']>>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  // Time conflict modal
  const [timeConflictGame, setTimeConflictGame] = useState<PickupGame | null>(null);

  const [draft, setDraft] = useState<GameDraft>(emptyDraft);

  useEffect(() => {
    async function loadGames() {
      try {
        const data = await fetchGames();
        setGames(data);
      } catch (error) {
        console.error('Failed to load games from Firestore:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  const now = new Date();

  const futureGames = useMemo(
    () =>
      games
        .filter((g) => new Date(g.startTime) > now)
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [games],
  );

  const upcomingGames = useMemo(
    () => futureGames.filter((g) => g.players.length < g.capacity).slice(0, 6),
    [futureGames],
  );

  const hasCreatedGame = useMemo(
    () => games.some((g) => g.organizer === user?.email && new Date(g.startTime) > now),
    [games, user],
  );

  const filteredAndSorted = useMemo(() => {
    let result = futureGames.filter((g) => {
      const matchesSport = sportFilter === 'All' || g.sport === sportFilter;
      const matchesSkill = skillFilter === 'All' || g.skillLevel === skillFilter;
      const matchesGender = genderFilter === 'All' || g.gender === genderFilter;
      return matchesSport && matchesSkill && matchesGender;
    });

    if (sortBy === 'spots-asc') {
      result = [...result].sort(
        (a, b) => a.capacity - a.players.length - (b.capacity - b.players.length),
      );
    } else if (sortBy === 'spots-desc') {
      result = [...result].sort(
        (a, b) => b.capacity - b.players.length - (a.capacity - a.players.length),
      );
    }

    return result;
  }, [futureGames, sportFilter, skillFilter, genderFilter, sortBy]);

  const sportGroups = useMemo(
    () =>
      featuredSports
        .map((sport) => ({
          sport,
          games: filteredAndSorted.filter((g) => g.sport === sport),
        }))
        .filter((group) => group.games.length > 0),
    [filteredAndSorted],
  );

  function isJoinedByUser(game: PickupGame): boolean {
    return !!user && game.players.some((p) => p.email === user.email);
  }

  function hasTimeConflict(target: PickupGame): PickupGame | null {
    if (!user) return null;

    const aStart = new Date(target.startTime).getTime();
    const aEnd = new Date(target.endTime).getTime();

    const conflict = games.find(
      (g) =>
        g.id !== target.id &&
        g.players.some((p) => p.email === user.email) &&
        aStart < new Date(g.endTime).getTime() &&
        aEnd > new Date(g.startTime).getTime(),
    );

    return conflict ?? null;
  }

  function isPastGame(game: PickupGame): boolean {
    return new Date(game.startTime) <= now;
  }

  function handleSignIn() {
    setShowLogin(true);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!loginName.trim() || !loginEmail.trim()) return;

    const newUser: User = {
      name: loginName.trim(),
      email: loginEmail.trim(),
    };

    setUser(newUser);
    setShowLogin(false);
    setLoginName('');
    setLoginEmail('');

    if (pendingJoinId) {
      try {
        const updated = await joinGame(pendingJoinId, newUser, games);
        setGames(updated);
        const joined = updated.find((g) => g.id === pendingJoinId) ?? null;
        setJoinedGame(joined);
      } catch (error) {
        console.error('Failed to join game after login:', error);
      } finally {
        setPendingJoinId(null);
      }
    }
  }

  function handleLogout() {
    setUser(null);
  }

  async function handleJoinGame(id: string) {
    if (!user) {
      setPendingJoinId(id);
      setShowLogin(true);
      return;
    }

    const target = games.find((g) => g.id === id);
    if (!target) return;

    const conflict = hasTimeConflict(target);
    if (conflict) {
      setTimeConflictGame(conflict);
      return;
    }

    try {
      const updated = await joinGame(id, user, games);
      setGames(updated);
      setJoinedGame(updated.find((g) => g.id === id) ?? null);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  }

  async function handleCreateGame() {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const draftWithOrganizer = { ...draft, organizer: user.email };

    try {
      const result = await createGame(draftWithOrganizer, games);

      if (result.conflict) {
        setConflictGame(result.conflict);
        return;
      }

      if (result.game) {
        setGames((prev) => [...prev, result.game as PickupGame]);
        setDraft(emptyDraft);
        setView('find');
      }
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  }

  const mapsUrl = (location: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${location}, Northwestern University, Evanston, IL`,
    )}`;

  if (loading) {
    return (
      <main className="app-shell">
        <div className="app-background" aria-hidden="true" />
        <Toolbar
          activeView={view}
          onNavigate={setView}
          user={user}
          onSignIn={handleSignIn}
          onLogout={handleLogout}
        />
        <section className="page-panel">
          <p>Loading games…</p>
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
          Play Local helps adults discover casual recreational sports nearby, join a roster
          that fits, and post a new game when the court or field needs one more player.
        </p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => setView('find')}>
            Find local games
          </button>
          <button className="secondary-button" type="button" onClick={() => setView('create')}>
            Create a game
          </button>
        </div>
      </div>

      <div className="home-upcoming">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">Upcoming games</p>
            <h2>Available near you</h2>
          </div>
          <p className="section-copy">Games with open spots happening soon.</p>
        </div>
        <div className="game-grid home-grid">
          {upcomingGames.length > 0 ? (
            upcomingGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onJoin={handleJoinGame}
                isPast={isPastGame(game)}
                isJoined={isJoinedByUser(game)}
              />
            ))
          ) : (
            <p style={{ color: 'rgba(247,244,236,0.6)' }}>No upcoming games right now.</p>
          )}
        </div>
      </div>
    </section>
  );

  const findSection = (
    <section className="page-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Find local games</p>
          <h2>Browse by sport</h2>
        </div>
        <div className="sort-controls">
          <label className="sort-label" htmlFor="sort-select">
            Sort by
          </label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="date">Soonest first</option>
            <option value="spots-desc">Most spots available</option>
            <option value="spots-asc">Filling up fastest</option>
          </select>
        </div>
      </div>

      <div className="filter-stack">
        <TagFilterGroup<PickupGame['sport']>
          label="Sport"
          value={sportFilter}
          options={['All', ...featuredSports] as Array<'All' | PickupGame['sport']>}
          onChange={(v) => setSportFilter(v as TagValue<PickupGame['sport']>)}
        />
        <TagFilterGroup<PickupGame['skillLevel']>
          label="Skill level"
          value={skillFilter}
          options={['All', ...skillLevels] as Array<'All' | PickupGame['skillLevel']>}
          onChange={(v) => setSkillFilter(v as TagValue<PickupGame['skillLevel']>)}
        />
        <TagFilterGroup<PickupGame['gender']>
          label="Gender"
          value={genderFilter}
          options={['All', ...genders] as Array<'All' | PickupGame['gender']>}
          onChange={(v) => setGenderFilter(v as TagValue<PickupGame['gender']>)}
        />
      </div>

      {sportGroups.length > 0 ? (
        sportGroups.map(({ sport, games: sportGames }) => (
          <div key={sport} className="sport-group">
            <div className="sport-group-header">
              <h3 className="sport-group-title">{sport}</h3>
              <span className="sport-group-count">
                {sportGames.length} game{sportGames.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="game-grid">
              {sportGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onJoin={handleJoinGame}
                  isPast={isPastGame(game)}
                  isJoined={isJoinedByUser(game)}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <h3>No games match these filters.</h3>
          <p>Try changing the filters or create a new game.</p>
        </div>
      )}
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

      {!user ? (
        <div className="notice-card">
          <p>You need to be signed in to create a game.</p>
          <button className="primary-button" type="button" onClick={() => setShowLogin(true)}>
            Sign In
          </button>
        </div>
      ) : hasCreatedGame ? (
        <div className="notice-card">
          <p>You already have an active hosted game. You can only host one game at a time.</p>
          <button className="secondary-button" type="button" onClick={() => setView('find')}>
            View all games
          </button>
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
          Our mission is to make recreational sports more accessible, welcoming, and easier
          to join for adults who want to stay active, meet people, and play without
          unnecessary barriers.
        </p>
        <div className="about-locations">
          <p className="eyebrow" style={{ marginTop: '8px' }}>
            Available locations
          </p>
          {Object.entries(locations).map(([name, info]) => (
            <div key={name} className="about-location-row">
              <strong>{name}</strong>
              <span className="tag" style={{ marginLeft: '10px' }}>
                {info.availability === 'anytime' ? 'Anytime' : 'Evenings & weekends'}
              </span>
              <span
                style={{
                  marginLeft: '10px',
                  color: 'rgba(247,244,236,0.6)',
                  fontSize: '0.88rem',
                }}
              >
                {info.sports.join(', ')}
              </span>
            </div>
          ))}
        </div>
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
      <Toolbar
        activeView={view}
        onNavigate={setView}
        user={user}
        onSignIn={handleSignIn}
        onLogout={handleLogout}
      />
      {currentSection}

      {showLogin && (
        <div className="modal" onClick={() => setShowLogin(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Welcome</p>
            <h2>Sign in to continue</h2>
            <p className="modal-body-text">
              Enter your name and email to join games and create listings.
            </p>
            <form className="modal-form" onSubmit={handleLogin}>
              <label>
                Name
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoFocus
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <div className="modal-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={!loginName.trim() || !loginEmail.trim()}
                >
                  Continue
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setShowLogin(false);
                    setPendingJoinId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {joinedGame && user && (
        <div className="modal" onClick={() => setJoinedGame(null)}>
          <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">You&apos;re in!</p>
            <h2>
              {joinedGame.sport} at {joinedGame.location}
            </h2>
            <p className="game-time">{formatGameTime(joinedGame.startTime)}</p>

            <div className="modal-details">
              <div className="modal-detail-row">
                <span className="modal-detail-label">Host</span>
                <a href={`mailto:${joinedGame.organizer}`} className="modal-link">
                  {joinedGame.organizer}
                </a>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Location</span>
                <a
                  href={mapsUrl(joinedGame.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-link"
                >
                  {joinedGame.location} → Google Maps ↗
                </a>
              </div>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Players</span>
                <span>
                  {joinedGame.players.length}/{joinedGame.capacity}
                </span>
              </div>
            </div>

            <div className="modal-participants">
              <p className="tag-filter-label">Participants</p>
              <ul className="participant-list">
                {joinedGame.players.map((p) => (
                  <li key={p.email} className="participant-item">
                    <span className="participant-name">{p.name}</span>
                    {user.email === joinedGame.organizer && (
                      <span className="participant-email">{p.email}</span>
                    )}
                  </li>
                ))}
              </ul>
              {user.email !== joinedGame.organizer && (
                <p className="modal-hint">Your email has been shared with the host.</p>
              )}
            </div>

            <button
              type="button"
              className="primary-button"
              style={{ marginTop: '8px' }}
              onClick={() => setJoinedGame(null)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {timeConflictGame && (
        <div className="modal" onClick={() => setTimeConflictGame(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Schedule conflict</p>
            <h2>You already have a game at this time</h2>
            <p className="modal-body-text">
              You&apos;re already signed up for a {timeConflictGame.sport} game that overlaps
              with this one. You can only join one game per time slot.
            </p>
            <div className="conflict-game-card">
              <p style={{ margin: 0, fontWeight: 700 }}>
                {timeConflictGame.sport} at {timeConflictGame.location}
              </p>
              <p className="game-time" style={{ marginTop: '6px' }}>
                {formatGameTime(timeConflictGame.startTime)} –{' '}
                {formatGameTime(timeConflictGame.endTime)}
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setTimeConflictGame(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {conflictGame && (
        <div className="modal" onClick={() => setConflictGame(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Heads up</p>
            <h2>A similar game already exists</h2>
            <p className="modal-body-text">
              There&apos;s already a {conflictGame.sport} game at {conflictGame.location}{' '}
              around that time. Would you like to join it instead?
            </p>
            <div className="conflict-game-card">
              <p className="game-time">{formatGameTime(conflictGame.startTime)}</p>
              <p
                style={{
                  margin: '4px 0 0',
                  color: 'rgba(247,244,236,0.7)',
                  fontSize: '0.9rem',
                }}
              >
                {conflictGame.players.length}/{conflictGame.capacity} players
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  handleJoinGame(conflictGame.id);
                  setConflictGame(null);
                }}
              >
                Join this game
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setConflictGame(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;