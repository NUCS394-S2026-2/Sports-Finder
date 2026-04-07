import './App.css';

import { useEffect, useMemo, useState } from 'react';

import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { TagFilterGroup } from './components/TagFilterGroup';
import { Toolbar, type ViewName } from './components/Toolbar';
import { ageRanges, emptyDraft, genders, skillLevels } from './data';
import {
  fetchUserProfile,
  loginWithEmail,
  logout,
  registerWithProfile,
  subscribeToAuth,
} from './lib/auth';
import { formatGameTime, toLocalDateTimeValue } from './lib/datetime';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { GameDraft, PickupGame, UserProfile } from './types';

type TagValue<T extends string> = 'All' | T;

function getAuthErrorMessage(error: unknown): string {
  const errorCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';

  if (errorCode === 'auth/configuration-not-found') {
    return 'Firebase Auth is not configured for this project yet. In Firebase Console, enable Authentication and turn on the Email/Password sign-in provider.';
  }

  if (errorCode === 'auth/invalid-credential') {
    return 'Invalid email or password.';
  }

  if (errorCode === 'auth/email-already-in-use') {
    return 'That email is already in use. Try logging in instead.';
  }

  if (errorCode === 'auth/weak-password') {
    return 'Password is too weak. Use at least 6 characters.';
  }

  return error instanceof Error ? error.message : 'Authentication failed';
}

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'Other' as UserProfile['gender'],
  });

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
    const unsubscribe = subscribeToAuth(async (user) => {
      if (!user) {
        setProfile(null);
        return;
      }

      const userProfile = await fetchUserProfile(user);
      setProfile(userProfile);
    });

    return unsubscribe;
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
    if (!profile) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    try {
      await joinGame(id, profile.name);
      const updated = await fetchGames();
      setGames(updated);
    } catch (err) {
      console.error('Failed to join game:', err);
    }
  }

  async function handleAuthSubmit() {
    setAuthError(null);

    try {
      if (authMode === 'login') {
        await loginWithEmail(authForm.email, authForm.password);
      } else {
        const parsedAge = Number(authForm.age);
        await registerWithProfile({
          email: authForm.email,
          password: authForm.password,
          name: authForm.name,
          age: Number.isFinite(parsedAge) ? parsedAge : 18,
          gender: authForm.gender,
        });
      }

      setAuthOpen(false);
      setAuthForm({
        email: '',
        password: '',
        name: '',
        age: '',
        gender: 'Other',
      });
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    }
  }

  async function handleCreateGame() {
    if (!profile) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

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
        <Toolbar
          activeView={view}
          onNavigate={setView}
          profile={profile}
          onOpenAuth={() => {
            setAuthMode('login');
            setAuthOpen(true);
          }}
          onLogout={async () => {
            await logout();
            setActiveGame(null);
          }}
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
            <GameCard
              key={game.id}
              game={game}
              onJoin={handleJoinGame}
              canSeePrivateDetails={Boolean(profile)}
              canJoin={Boolean(profile)}
            />
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
            canSeePrivateDetails={Boolean(profile)}
            canJoin={Boolean(profile)}
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

            <h2>{profile ? activeGame.location : 'Login to view location'}</h2>
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
                <dd>{profile ? activeGame.organizer : 'Login required'}</dd>
              </div>
              <div>
                <dt>Players</dt>
                <dd>
                  {activeGame.spotsFilled}/{activeGame.capacity}
                </dd>
              </div>
            </dl>

            {profile ? (
              <div className="attendees-list">
                <p className="attendees-title">Attendees</p>
                <p>
                  {activeGame.attendees.length > 0
                    ? activeGame.attendees.join(', ')
                    : 'No attendees yet.'}
                </p>
              </div>
            ) : null}

            <div className="form-actions">
              <button
                type="button"
                className="join-button"
                disabled={activeGame.capacity - activeGame.spotsFilled <= 0 || !profile}
                onClick={async () => {
                  await handleJoinGame(activeGame.id);
                  setActiveGame(null);
                }}
              >
                {activeGame.capacity - activeGame.spotsFilled <= 0
                  ? 'Game full'
                  : profile
                    ? 'Join game'
                    : 'Login to join'}
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

      {profile ? (
        <GameForm
          draft={draft}
          onChange={setDraft}
          onClose={() => setView('find')}
          onSubmit={handleCreateGame}
          games={games}
          onViewGame={handleViewGame}
        />
      ) : (
        <section className="form-card" aria-label="Login required to create games">
          <h3>Log in required</h3>
          <p>You need an account to create and host a game.</p>
          <div className="form-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setAuthMode('login');
                setAuthOpen(true);
              }}
            >
              Log in to create
            </button>
          </div>
        </section>
      )}
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
      <Toolbar
        activeView={view}
        onNavigate={setView}
        profile={profile}
        onOpenAuth={() => {
          setAuthMode('login');
          setAuthOpen(true);
        }}
        onLogout={async () => {
          await logout();
          setActiveGame(null);
        }}
      />
      {currentSection}

      {authOpen ? (
        <div className="auth-modal-backdrop">
          <article
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Authentication"
          >
            <h2>{authMode === 'login' ? 'Log in' : 'Create account'}</h2>

            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </label>

            {authMode === 'register' ? (
              <>
                <label>
                  Name
                  <input
                    value={authForm.name}
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>

                <label>
                  Age
                  <input
                    type="number"
                    min={13}
                    max={120}
                    value={authForm.age}
                    onChange={(event) =>
                      setAuthForm((current) => ({ ...current, age: event.target.value }))
                    }
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={authForm.gender}
                    onChange={(event) =>
                      setAuthForm((current) => ({
                        ...current,
                        gender: event.target.value as UserProfile['gender'],
                      }))
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </>
            ) : null}

            {authError ? (
              <p className="notification notification-error">{authError}</p>
            ) : null}

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAuthOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleAuthSubmit}>
                {authMode === 'login' ? 'Log in' : 'Sign up'}
              </button>
            </div>

            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                setAuthMode((current) => (current === 'login' ? 'register' : 'login'))
              }
            >
              {authMode === 'login'
                ? 'Need an account? Sign up'
                : 'Already have an account? Log in'}
            </button>
          </article>
        </div>
      ) : null}
    </main>
  );
}

export default App;
