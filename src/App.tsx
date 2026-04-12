import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';

import { GameCard } from './components/GameCard';
import { GameDetailView } from './components/GameDetailView';
import { GameForm } from './components/GameForm';
import {
  type AppNotification,
  NotificationList,
  NotificationShell,
} from './components/NotificationList';
import { TagFilterGroup } from './components/TagFilterGroup';
import { AppNavbar } from './components/ui/AppNavbar';
import { BottomTabBar } from './components/ui/BottomTabBar';
import { Button } from './components/ui/Button';
import type { ViewName } from './components/ui/viewNames';
import { emptyDraft, featuredSports, genders, locations, skillLevels } from './data';
import { formatGameTime } from './lib/datetime';
import {
  getFirebaseAuth,
  googleAuthProvider,
  isFirebaseConfigured,
} from './lib/firebase';
import { createGame, fetchGames, joinGame, leaveGame } from './lib/games';
import { sportEmoji } from './lib/sports';
import type { GameDraft, PickupGame, User } from './types';

type SortOption = 'date' | 'spots-asc' | 'spots-desc';
type TagValue<T extends string> = 'All' | T;

const HERO_BG =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=2000&q=80';

function App() {
  const [view, setView] = useState<ViewName>('home');
  const [detailGameId, setDetailGameId] = useState<string | null>(null);
  const [games, setGames] = useState<PickupGame[]>([]);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [pendingJoinId, setPendingJoinId] = useState<string | null>(null);

  const [joinedGame, setJoinedGame] = useState<PickupGame | null>(null);
  const [createConflictGame, setCreateConflictGame] = useState<PickupGame | null>(null);
  const [timeConflictGame, setTimeConflictGame] = useState<PickupGame | null>(null);

  const [sportFilter, setSportFilter] = useState<TagValue<PickupGame['sport']>>('All');
  const [skillFilter, setSkillFilter] =
    useState<TagValue<PickupGame['skillLevel']>>('All');
  const [genderFilter, setGenderFilter] = useState<TagValue<PickupGame['gender']>>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [draft, setDraft] = useState<GameDraft>(emptyDraft);

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setGames(fetchGames());
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setBootstrapping(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const email = fbUser.email?.toLowerCase() ?? '';
        const name = fbUser.displayName?.trim() || email.split('@')[0] || 'Player';
        setUser({ name, email });
      } else {
        setUser(null);
      }
      setBootstrapping(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || pendingJoinId == null) return;
    const gameId = pendingJoinId;
    setPendingJoinId(null);
    setShowLogin(false);
    setLoginError(null);
    setGames((prev) => {
      const updated = joinGame(gameId, user, prev);
      const joined = updated.find((g) => g.id === gameId) ?? null;
      if (joined) {
        queueMicrotask(() => setJoinedGame(joined));
      }
      return updated;
    });
  }, [user, pendingJoinId]);

  useEffect(() => {
    setCreateConflictGame(null);
  }, [draft.sport, draft.location, draft.date, draft.startTime, draft.endTime]);

  const now = new Date();

  const futureGames = useMemo(
    () =>
      games
        .filter((g) => new Date(g.startTime) > new Date())
        .sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
    [games],
  );

  const upcomingGames = useMemo(
    () => futureGames.filter((g) => g.players.length < g.capacity).slice(0, 6),
    [futureGames],
  );

  const hasCreatedGame = useMemo(
    () =>
      games.some(
        (g) => g.organizer === user?.email && new Date(g.startTime) > new Date(),
      ),
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

  const searchFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredAndSorted;
    return filteredAndSorted.filter(
      (g) =>
        g.sport.toLowerCase().includes(q) ||
        g.location.toLowerCase().includes(q) ||
        g.note.toLowerCase().includes(q) ||
        g.organizer.toLowerCase().includes(q),
    );
  }, [filteredAndSorted, searchQuery]);

  const detailGame = useMemo(
    () => (detailGameId ? (games.find((g) => g.id === detailGameId) ?? null) : null),
    [games, detailGameId],
  );

  const notificationItems = useMemo((): AppNotification[] => {
    return [
      {
        id: 'n1',
        kind: 'info',
        title: 'Maya Chen joined your evening Soccer run',
        time: '3m ago',
        unread: true,
      },
      {
        id: 'n2',
        kind: 'cancel',
        title: 'Your game has been cancelled',
        body: 'Tuesday tennis ladders at Northwestern Tennis Courts — courts closed for maintenance.',
        time: '1h ago',
      },
      {
        id: 'n3',
        kind: 'info',
        title: 'Reminder: Frisbee at Deering Meadow starts at 5:30pm',
        time: 'Yesterday',
        unread: true,
      },
    ];
  }, []);

  const gamesJoined = useMemo(
    () =>
      user
        ? games.filter((g) => g.players.some((p) => p.email === user.email)).length
        : 0,
    [games, user],
  );

  const gamesHosted = useMemo(
    () => (user ? games.filter((g) => g.organizer === user.email).length : 0),
    [games, user],
  );

  const profileUpcoming = useMemo(() => {
    if (!user) return [];
    return futureGames
      .filter((g) => g.players.some((p) => p.email === user.email))
      .slice(0, 8);
  }, [futureGames, user]);

  const profilePast = useMemo(() => {
    if (!user) return [];
    return games
      .filter(
        (g) =>
          new Date(g.startTime) <= now && g.players.some((p) => p.email === user.email),
      )
      .slice(-8)
      .reverse();
  }, [games, user, now]);

  function navigateTo(next: ViewName) {
    setView(next);
    if (next !== 'game-detail') setDetailGameId(null);
    if (next !== 'find' && next !== 'game-detail') setCreateConflictGame(null);
    setNotificationsOpen(false);
  }

  function openGameDetail(id: string) {
    setDetailGameId(id);
    setView('game-detail');
    setNotificationsOpen(false);
  }

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

  async function handleGoogleSignIn() {
    setLoginError(null);
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoginError(
        'Firebase is not configured. Add VITE_FIREBASE_* keys for your web app in .env.local.',
      );
      return;
    }
    setLoginBusy(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      setShowLogin(false);
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code)
          : '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      setLoginError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }

  function handleJoinGame(id: string) {
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
    const updated = joinGame(id, user, games);
    setGames(updated);
    setJoinedGame(updated.find((g) => g.id === id) ?? null);
  }

  function handleLeaveGame(id: string) {
    if (!user) return;
    setGames((prev) => leaveGame(id, user, prev));
    setJoinedGame((current) => (current?.id === id ? null : current));
  }

  function handleCreateGame() {
    if (!user) {
      setShowLogin(true);
      return;
    }
    const draftWithOrganizer = { ...draft, organizer: user.email };
    const result = createGame(draftWithOrganizer, games);
    if (result.conflict) {
      setCreateConflictGame(result.conflict);
      return;
    }
    setCreateConflictGame(null);
    if (result.game) {
      setGames((prev) => [...prev, result.game!]);
      setDraft(emptyDraft);
      navigateTo('find');
    }
  }

  function handlePostAnyway() {
    if (!user) return;
    const draftWithOrganizer = { ...draft, organizer: user.email };
    const result = createGame(draftWithOrganizer, games, { ignoreConflict: true });
    setCreateConflictGame(null);
    if (result.game) {
      setGames((prev) => [...prev, result.game!]);
      setDraft(emptyDraft);
      navigateTo('find');
    }
  }

  function handleViewConflictGame(id: string) {
    setCreateConflictGame(null);
    openGameDetail(id);
  }

  const mapsUrl = (location: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location + ', Northwestern University, Evanston, IL')}`;

  const venueShowcase = [
    {
      sport: 'Tennis' as const,
      emoji: '🎾',
      name: 'Northwestern Tennis Courts',
      address: locations['Northwestern Tennis Courts'].address,
    },
    {
      sport: 'Soccer' as const,
      emoji: '⚽',
      name: 'Hutchison Field',
      address: locations['Hutchson Field'].address,
    },
    {
      sport: 'Frisbee' as const,
      emoji: '🥏',
      name: 'Deering Meadow',
      address: locations['Deering Meadow'].address,
    },
  ];

  const notificationsDropdown = (
    <NotificationShell>
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-bold text-ink">Notifications</p>
      </div>
      <NotificationList
        items={notificationItems}
        onBrowseGames={() => {
          setNotificationsOpen(false);
          navigateTo('find');
        }}
      />
    </NotificationShell>
  );

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-ink pt-20 text-cream">
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-ink via-[#111d2c] to-[#203b56]"
          aria-hidden
        />
        <p className="px-5 text-center">Loading games…</p>
      </div>
    );
  }

  const homeSection = (
    <div className="space-y-0">
      <section className="relative overflow-hidden py-20 sm:py-24" aria-label="Hero">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-ink/78" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white sm:text-5xl">
            Your next game starts here.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-cream/85 sm:text-lg">
            Built for Northwestern students who want real games without the group chat
            scavenger hunt. Browse open runs, join a roster, and host when you have the
            court.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Button
              variant="primary"
              className="w-full min-h-[48px] justify-center sm:w-auto sm:px-10"
              type="button"
              onClick={() => navigateTo('find')}
            >
              Browse Games
            </Button>
            <button
              type="button"
              onClick={() => (user ? navigateTo('find') : handleSignIn())}
              className="w-full min-h-[48px] rounded-full border-2 border-brand-400 bg-transparent px-8 py-3 text-sm font-extrabold text-brand-400 transition hover:bg-brand-400/10 sm:w-auto"
            >
              {user ? 'Go to games' : 'Sign In'}
            </button>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-cream sm:text-3xl">Where we play</h2>
          <p className="mt-2 max-w-2xl text-cream-muted">
            Outdoor spaces around campus students actually use for pickup.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:gap-8">
            {venueShowcase.map((v) => (
              <article
                key={v.sport}
                className="flex flex-col rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-6 shadow-[0_24px_60px_rgba(2,8,18,0.3)] backdrop-blur-xl"
              >
                <span className="text-4xl" aria-hidden>
                  {v.emoji}
                </span>
                <h3 className="mt-4 text-lg font-bold text-cream">{v.sport}</h3>
                <p className="mt-1 font-semibold text-cream/95">{v.name}</p>
                <p className="mt-2 text-sm text-cream-muted">{v.address}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSportFilter(v.sport);
                    navigateTo('find');
                  }}
                  className="mt-6 inline-flex text-left text-sm font-bold text-brand-400 hover:underline"
                >
                  View Games →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {upcomingGames.length > 0 && (
        <section className="border-t border-white/10 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-cream">Opening soon</h2>
                <p className="text-cream-muted">
                  Games on campus with room for one more.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('find')}
                className="text-sm font-bold text-brand-400 hover:underline"
              >
                See all games →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {upcomingGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onJoin={handleJoinGame}
                  onLeave={handleLeaveGame}
                  onOpenDetail={openGameDetail}
                  isPast={isPastGame(game)}
                  isJoined={isJoinedByUser(game)}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );

  const findSection = (
    <div className="space-y-10 py-12">
      {user && (
        <div>
          <h1 className="text-2xl font-bold text-cream">
            Hey, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-cream-muted">Find a game that fits your night.</p>
        </div>
      )}

      <label className="block">
        <span className="sr-only">Search games</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by sport, venue, or host…"
          className="w-full min-h-11 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-cream placeholder:text-cream/40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-400"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {(['Tennis', 'Soccer', 'Frisbee'] as const).map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => setSportFilter(sportFilter === sport ? 'All' : sport)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              sportFilter === sport
                ? 'border-transparent bg-gradient-to-br from-brand-500 to-brand-400 text-ink'
                : 'border-white/15 bg-white/5 text-cream hover:border-white/25 hover:bg-white/10'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setShowMoreFilters((s) => !s)}
          className="w-fit text-sm font-semibold text-brand-400 hover:underline"
        >
          {showMoreFilters ? 'Hide filters' : 'More filters'}
        </button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm text-cream-muted" htmlFor="sort-select">
            Sort by
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="min-h-11 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-cream focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-400"
          >
            <option value="date">Soonest first</option>
            <option value="spots-desc">Most spots available</option>
            <option value="spots-asc">Filling up fastest</option>
          </select>
        </div>
      </div>

      {showMoreFilters && (
        <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 md:grid-cols-2">
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
      )}

      {searchFiltered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {searchFiltered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onJoin={handleJoinGame}
              onLeave={handleLeaveGame}
              onOpenDetail={openGameDetail}
              isPast={isPastGame(game)}
              isJoined={isJoinedByUser(game)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-10 text-center backdrop-blur-xl">
          <h3 className="text-xl font-bold text-cream">No games match these filters.</h3>
          <p className="mt-2 text-cream-muted">
            Try another sport pill or widen your search.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            type="button"
            onClick={() => navigateTo('create')}
          >
            Host a game
          </Button>
        </div>
      )}
    </div>
  );

  const createSection = (
    <div className="py-12">
      {!user ? (
        <div className="mx-auto max-w-md rounded-2xl border border-white/12 bg-white/5 p-8 text-center">
          <p className="text-cream-muted">You need to be signed in to create a game.</p>
          <Button
            variant="primary"
            className="mt-6 w-full justify-center"
            type="button"
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </div>
      ) : hasCreatedGame ? (
        <div className="mx-auto max-w-md rounded-2xl border border-white/12 bg-white/5 p-8 text-center">
          <p className="text-cream-muted">
            You already have an active hosted game. You can only host one game at a time.
          </p>
          <Button
            variant="secondary"
            className="mt-6 w-full justify-center"
            type="button"
            onClick={() => navigateTo('find')}
          >
            View all games
          </Button>
        </div>
      ) : (
        <GameForm
          draft={draft}
          onChange={setDraft}
          onClose={() => navigateTo('find')}
          onSubmit={handleCreateGame}
          sports={featuredSports}
          games={games}
          conflictGame={createConflictGame}
          onViewConflictGame={handleViewConflictGame}
          onPostAnyway={handlePostAnyway}
        />
      )}
    </div>
  );

  const profileSection = (
    <div className="py-12">
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-3">
        <aside className="space-y-6 rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-6 backdrop-blur-xl xl:sticky xl:top-24 xl:self-start">
          {user ? (
            <>
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-400 text-2xl font-black text-ink">
                {user.name
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-cream">{user.name}</h2>
              <p className="text-sm text-cream-muted">{user.email}</p>
              <div className="flex flex-wrap gap-2">
                {featuredSports.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-gradient-to-br from-brand-500/25 to-brand-400/15 px-3 py-1 text-xs font-bold text-brand-400 ring-1 ring-brand-400/25"
                  >
                    {sportEmoji(s)} {s}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-cream-muted underline-offset-4 transition hover:text-cream hover:underline"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-cream-muted">Sign in to see your stats and history.</p>
              <Button
                variant="primary"
                className="w-full justify-center"
                type="button"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            </div>
          )}
        </aside>

        <div className="space-y-12 xl:col-span-2">
          {user && (
            <div className="grid grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div>
                <p className="text-3xl font-black text-cream">{gamesJoined}</p>
                <p className="text-sm font-semibold text-cream-muted">Games joined</p>
              </div>
              <div>
                <p className="text-3xl font-black text-cream">{gamesHosted}</p>
                <p className="text-sm font-semibold text-cream-muted">Games hosted</p>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-lg font-bold text-cream">Upcoming for you</h3>
            <div className="mt-4 space-y-3">
              {user && profileUpcoming.length > 0 ? (
                profileUpcoming.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => openGameDetail(g.id)}
                    className="flex w-full flex-col gap-1 rounded-xl border border-white/10 bg-[rgba(9,15,24,0.55)] px-4 py-3 text-left transition hover:border-brand-400/40"
                  >
                    <span className="font-semibold text-cream">
                      {g.sport} · {g.location}
                    </span>
                    <span className="text-sm text-brand-400">
                      {formatGameTime(g.startTime)}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-cream-muted">
                  {user
                    ? 'No upcoming games yet — browse open runs.'
                    : 'Sign in to track your games.'}
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cream">Past games</h3>
            <div className="mt-4 space-y-3">
              {user && profilePast.length > 0 ? (
                profilePast.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 opacity-80"
                  >
                    <span className="font-semibold text-cream">
                      {g.sport} · {g.location}
                    </span>
                    <span className="text-sm text-cream-muted">
                      {formatGameTime(g.startTime)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-cream-muted">
                  {user
                    ? 'Your past pickups will show up here.'
                    : 'Sign in to see history.'}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-bold text-cream">
              Why Pickup Sports Finder exists
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-cream-muted">
              Pickup games fall apart when coordination lives in ten different chats. This
              prototype keeps listings visible, makes joining one tap, and helps hosts
              share courts without spamming mailing lists.
            </p>
          </section>
        </div>
      </div>
    </div>
  );

  const notificationsPage = (
    <div className="py-10">
      <h1 className="text-2xl font-black text-cream">Notifications</h1>
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)]">
        <NotificationList
          items={notificationItems}
          onBrowseGames={() => navigateTo('find')}
        />
      </div>
    </div>
  );

  const gameDetailSection = detailGame ? (
    <div className="py-10">
      <GameDetailView
        game={detailGame}
        mapsUrl={mapsUrl}
        isJoined={isJoinedByUser(detailGame)}
        isPast={isPastGame(detailGame)}
        onJoin={handleJoinGame}
        onLeave={handleLeaveGame}
        onBack={() => navigateTo('find')}
      />
    </div>
  ) : (
    <div className="py-20 text-center text-cream-muted">
      <p>Game not found.</p>
      <Button
        variant="secondary"
        className="mt-6"
        type="button"
        onClick={() => navigateTo('find')}
      >
        Back to games
      </Button>
    </div>
  );

  const currentMain =
    view === 'home'
      ? homeSection
      : view === 'find'
        ? findSection
        : view === 'create'
          ? createSection
          : view === 'profile'
            ? profileSection
            : view === 'notifications'
              ? notificationsPage
              : view === 'game-detail'
                ? gameDetailSection
                : homeSection;

  return (
    <div className="min-h-screen bg-ink text-cream">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-ink via-[#111d2c] to-[#203b56]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,175,88,0.22),transparent_32%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_right_center,rgba(106,205,255,0.14),transparent_26%)]"
        aria-hidden
      />

      <AppNavbar
        activeView={view}
        onNavigate={navigateTo}
        user={user}
        onSignIn={handleSignIn}
        onLogout={handleLogout}
        notificationsOpen={notificationsOpen}
        onNotificationsOpenChange={setNotificationsOpen}
        notificationsDropdown={notificationsDropdown}
        onOpenNotificationsPage={() => navigateTo('notifications')}
      />

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-5 md:px-6 md:pb-12 lg:px-8">
        {currentMain}
      </main>

      <BottomTabBar activeView={view} onNavigate={navigateTo} />

      {showLogin && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/70 px-4 py-10 backdrop-blur-sm sm:items-center sm:py-16"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setShowLogin(false);
            setPendingJoinId(null);
            setLoginError(null);
          }}
          role="presentation"
        >
          <div
            className="mt-4 w-full max-w-md rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.96)] p-6 shadow-2xl sm:mt-20 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signin-heading"
          >
            <div className="mb-6 text-center">
              <p className="text-lg font-bold text-brand-400">Pickup Sports Finder</p>
              <h2 id="signin-heading" className="mt-3 text-2xl font-bold text-cream">
                Sign in to join the game.
              </h2>
              <p className="mt-2 text-sm text-cream-muted">
                Use your Google account. We use your name and email for rosters and host
                contact.
              </p>
            </div>
            <div className="space-y-4 pb-10">
              {loginError && (
                <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {loginError}
                </div>
              )}
              <button
                type="button"
                disabled={loginBusy || !isFirebaseConfigured()}
                onClick={() => void handleGoogleSignIn()}
                className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loginBusy ? 'Signing in…' : 'Continue with Google'}
              </button>
              {!isFirebaseConfigured() && (
                <p className="text-center text-xs text-cream-muted">
                  Set <code className="rounded bg-white/10 px-1">VITE_FIREBASE_*</code> in{' '}
                  <code className="rounded bg-white/10 px-1">.env.local</code> and enable
                  the Google provider in the Firebase console.
                </p>
              )}
              <button
                type="button"
                className="w-full text-sm text-cream-muted underline-offset-4 hover:underline"
                onClick={() => {
                  setShowLogin(false);
                  setPendingJoinId(null);
                  setLoginError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {joinedGame && user && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 px-4 py-8 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setJoinedGame(null);
          }}
          role="presentation"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.96)] p-6 shadow-2xl sm:p-8"
            role="dialog"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-accent">
              You&apos;re in
            </p>
            <h2 className="mt-2 text-2xl font-bold text-cream">
              {joinedGame.sport} at {joinedGame.location}
            </h2>
            <p className="mt-2 text-sm font-bold text-brand-400">
              {formatGameTime(joinedGame.startTime)}
            </p>
            <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-cream-muted">Host</span>
                <a
                  href={`mailto:${joinedGame.organizer}`}
                  className="font-semibold text-sky-accent"
                >
                  {joinedGame.organizer}
                </a>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-cream-muted">Players</span>
                <span className="font-semibold text-cream">
                  {joinedGame.players.length}/{joinedGame.capacity}
                </span>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {joinedGame.players.map((p) => (
                <li
                  key={p.email}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-cream">{p.name}</span>
                  {user.email === joinedGame.organizer && (
                    <span className="ml-2 text-xs text-cream-muted">{p.email}</span>
                  )}
                </li>
              ))}
            </ul>
            <Button
              variant="primary"
              className="mt-6 w-full justify-center"
              type="button"
              onClick={() => setJoinedGame(null)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}

      {timeConflictGame && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target !== e.currentTarget) return;
            setTimeConflictGame(null);
          }}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.96)] p-6 shadow-2xl"
            role="dialog"
          >
            <h2 className="text-xl font-bold text-cream">Schedule conflict</h2>
            <p className="mt-2 text-sm text-cream-muted">
              You&apos;re already signed up for a game that overlaps with this one.
            </p>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-bold text-cream">
                {timeConflictGame.sport} at {timeConflictGame.location}
              </p>
              <p className="mt-1 text-sm text-brand-400">
                {formatGameTime(timeConflictGame.startTime)} –{' '}
                {formatGameTime(timeConflictGame.endTime)}
              </p>
            </div>
            <Button
              variant="primary"
              className="mt-6 w-full justify-center"
              type="button"
              onClick={() => setTimeConflictGame(null)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
