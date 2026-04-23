import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useMatch,
  useNavigate,
} from 'react-router-dom';

import { GameCard } from './components/GameCard';
import { GameDetailView } from './components/GameDetailView';
import { GameForm } from './components/GameForm';
import { SignedUpGameCard } from './components/SignedUpGameCard';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import {
  NotificationList,
  NotificationShell,
  type AppNotification,
} from './components/NotificationList';
import { TagFilterGroup } from './components/TagFilterGroup';
import { AppNavbar } from './components/ui/AppNavbar';
import { BottomTabBar } from './components/ui/BottomTabBar';
import { Button } from './components/ui/Button';
import type { ViewName } from './components/ui/viewNames';
import { emptyDraft, featuredSports, genders, skillLevels } from './data';
import { formatGameTime, formatHomeCardDateTime } from './lib/datetime';
import { pathForView, paths, viewFromPathname } from './lib/routes';
import {
  getFirebaseAuth,
  getFirebaseProjectIdForDiagnostics,
  googleAuthProvider,
  isFirebaseConfigured,
} from './lib/firebase';
import {
  addPlayerToGame,
  createGame,
  deleteGameFromFirestore,
  fetchGames,
  getLocalGamesFallback,
  isFirestorePermissionError,
  isSessionOnlyGameId,
  joinGame,
  leaveGame,
  removePlayerFromGame,
  seedGamesIfEmpty,
} from './lib/games';
import { homeGameCardTitle, sportEmoji, sportHomeCategoryLabel } from './lib/sports';
import type { GameDraft, PickupGame, User } from './types';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from './lib/firebase';

type SortOption = 'date' | 'spots-asc' | 'spots-desc';
type TagValue<T extends string> = 'All' | T;

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const gameDetailMatch = useMatch({ path: '/games/:gameId', end: true });
  const detailGameId = gameDetailMatch?.params.gameId
    ? decodeURIComponent(gameDetailMatch.params.gameId)
    : null;

  const activeView = viewFromPathname(location.pathname);
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
  const [chatNotifications, setChatNotifications] = useState<AppNotification[]>([]);
  const [visitedGameIds, setVisitedGameIds] = useState<Set<string>>(new Set());
  /** Shown when a game was created without a real Firestore document (rules / config). */
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null);
  /** Firestore returned permission-denied even though .env looks configured (wrong project, App Check, API key, …). */
  const [firestorePermissionBanner, setFirestorePermissionBanner] = useState<
    string | null
  >(null);

  // One listener: UI user + Firestore seed/fetch on every auth change (e.g. after Google sign-in).
  // A single mount-time fetch misses Google sign-in because games were already loaded once.
  useEffect(() => {
    let cancelled = false;
    let unsubAuth: (() => void) | null = null;
    const auth = getFirebaseAuth();

    async function loadGamesFromFirestore() {
      const a = getFirebaseAuth();
      if (a?.currentUser) {
        try {
          await a.currentUser.getIdToken();
        } catch {
          // Firestore may still attach; avoids occasional post-sign-in permission races
        }
      }
      try {
        await seedGamesIfEmpty();
      } catch (err) {
        if (isFirestorePermissionError(err)) {
          console.warn(
            'seedGamesIfEmpty skipped or partial (Firestore permission). Games may still load.',
            err,
          );
        } else {
          console.error(
            'seedGamesIfEmpty failed (games may still load if Firestore allows read)',
            err,
          );
        }
      }
      try {
        const { games: data, source } = await fetchGames();
        if (!cancelled) {
          setGames(data);
          if (source === 'bundled-permission') {
            const pid = getFirebaseProjectIdForDiagnostics() || 'unknown';
            setFirestorePermissionBanner(
              `Firestore blocked reads for project “${pid}”. Open rules (allow all) still produce this when the app points at the wrong project, App Check is enforcing Firestore, or the web API key is restricted in Google Cloud. Fix those, then hard-refresh.`,
            );
          } else {
            setFirestorePermissionBanner(null);
          }
        }
      } catch (err) {
        console.error('fetchGames failed', err);
        if (!cancelled) setGames(getLocalGamesFallback());
      }
    }

    if (!auth) {
      setBootstrapping(false);
      void loadGamesFromFirestore();
      return () => {
        cancelled = true;
      };
    }

    const firebaseAuth = auth;

    async function syncGamesForAuthUser(fbUser: FirebaseUser | null) {
      if (cancelled) return;
      await firebaseAuth.authStateReady();
      if (cancelled) return;
      await loadGamesFromFirestore();
    }

    void (async () => {
      await firebaseAuth.authStateReady();
      if (cancelled) return;
      unsubAuth = onAuthStateChanged(firebaseAuth, (fbUser) => {
        if (cancelled) return;
        if (fbUser?.isAnonymous) {
          setUser(null);
          setBootstrapping(false);
          void signOut(firebaseAuth);
          void loadGamesFromFirestore();
          return;
        }
        if (fbUser) {
          const email = fbUser.email?.toLowerCase() ?? '';
          const name = fbUser.displayName?.trim() || email.split('@')[0] || 'Player';
          setUser({ name, email });
        } else {
          setUser(null);
        }
        setBootstrapping(false);
        void syncGamesForAuthUser(fbUser);
      });
    })();

    return () => {
      cancelled = true;
      unsubAuth?.();
    };
  }, []);

  useEffect(() => {
    if (!user || pendingJoinId == null) return;
    const gameId = pendingJoinId;
    setPendingJoinId(null);
    setShowLogin(false);
    setLoginError(null);
    void (async () => {
      try {
        await addPlayerToGame(gameId, user);
      } catch (err) {
        if (isFirestorePermissionError(err)) {
          console.warn(
            'addPlayerToGame (pending join): Firestore denied — roster updated locally only.',
            err,
          );
        } else {
          console.error('addPlayerToGame (pending join) failed', err);
          return;
        }
      }
      setGames((prev) => {
        const updated = joinGame(gameId, user, prev);
        const joined = updated.find((g) => g.id === gameId) ?? null;
        if (joined) {
          queueMicrotask(() => setJoinedGame(joined));
        }
        return updated;
      });
    })();
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

  /** One upcoming game per sport category (soonest; prefer a listing with open spots). */
  const homeHappeningBySport = useMemo(() => {
    return featuredSports.map((sport) => {
      const forSport = futureGames.filter((g) => g.sport === sport);
      const withSpots = forSport.filter((g) => g.players.length < g.capacity);
      const game = withSpots[0] ?? forSport[0] ?? null;
      return { sport, game };
    });
  }, [futureGames]);

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
    return chatNotifications.filter((n) => !n.gameID || !visitedGameIds.has(n.gameID));
  }, [chatNotifications, visitedGameIds]);
  const gamesHosted = useMemo(
    () =>
      user
        ? games.filter((g) => g.organizer.toLowerCase() === user.email.toLowerCase())
            .length
        : 0,
    [games, user],
  );

  const signedUpGames = useMemo(() => {
    if (!user) return [];
    const normalized = user.email.toLowerCase();
    return [...games]
      .filter((game) =>
        game.players.some((player) => player.email.toLowerCase() === normalized),
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [games, user]);

  useEffect(() => {
    if (!user || signedUpGames.length === 0 || !db) return;
    const unsubscribers: (() => void)[] = [];

    signedUpGames.forEach((game) => {
      if (!game.id || game.id.startsWith('session-')) return;
      const messagesRef = collection(db, 'games', game.id, 'messages');
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));

      const unsub = onSnapshot(messagesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          const data = change.doc.data();
          const senderId = String(data.senderId ?? '').toLowerCase();
          if (senderId === user.email.toLowerCase()) return; // skip own messages
          if (visitedGameIds.has(game.id)) return; // skip if user already viewed this chat
          const newNotif: AppNotification = {
            id: `chat-${change.doc.id}`,
            kind: 'info',
            title: `${data.senderName ?? 'Someone'} in ${game.sport} chat: "${String(data.text ?? '').slice(0, 60)}"`,
            time: data.timestamp?.toDate
              ? data.timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : 'Just now',
            unread: true,
            gameID: game.id,
          };

          setChatNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        });
      });

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((u) => u());
  }, [user, signedUpGames]);

  const signedUpUpcoming = useMemo(
    () => signedUpGames.filter((game) => new Date(game.startTime) > now),
    [signedUpGames, now],
  );

  const signedUpPast = useMemo(
    () => signedUpGames.filter((game) => new Date(game.startTime) <= now),
    [signedUpGames, now],
  );

  const hasCreatedGame = useMemo(
    () =>
      games.some(
        (g) =>
          !!user &&
          g.organizer.toLowerCase() === user.email.toLowerCase() &&
          new Date(g.startTime) > new Date(),
      ),
    [games, user],
  );

  function navigateTo(next: ViewName) {
    if (next === 'game-detail') return;
    navigate(pathForView(next));
    if (next !== 'find') setCreateConflictGame(null);
    setNotificationsOpen(false);
  }

  function openGameDetail(id: string) {
    navigate(paths.game(id));
    setNotificationsOpen(false);
    setVisitedGameIds((prev) => new Set([...prev, id]));
  }

  function isJoinedByUser(game: PickupGame): boolean {
    if (!user) return false;
    const u = user.email.toLowerCase();
    return game.players.some((p) => p.email.toLowerCase() === u);
  }

  function isUserOrganizer(game: PickupGame): boolean {
    return !!user && game.organizer.toLowerCase() === user.email.toLowerCase();
  }

  function hasTimeConflict(target: PickupGame): PickupGame | null {
    if (!user) return null;
    const aStart = new Date(target.startTime).getTime();
    const aEnd = new Date(target.endTime).getTime();
    const conflict = games.find(
      (g) =>
        g.id !== target.id &&
        g.players.some((p) => p.email.toLowerCase() === user.email.toLowerCase()) &&
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
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
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
      await addPlayerToGame(id, user);
    } catch (err) {
      if (isFirestorePermissionError(err)) {
        console.warn(
          'addPlayerToGame: Firestore denied — roster updated locally only until rules allow writes.',
          err,
        );
      } else {
        console.error('addPlayerToGame failed', err);
        setLoginError(
          'Could not join game. Check Firestore rules and that you are signed in.',
        );
        return;
      }
    }
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, players: [...g.players, user] } : g)),
    );
    const updated = { ...target, players: [...target.players, user] };
    setGames((prev) => prev.map((g) => (g.id === id ? updated : g)));
    setJoinedGame(updated);
    try {
      await addPlayerToGame(id, user);
    } catch (err) {
      console.error('Failed to save join to Firestore:', err);
    }
  }

  async function handleLeaveGame(id: string) {
    if (!user) return;
    const target = games.find((g) => g.id === id);
    if (target && target.organizer.toLowerCase() === user.email.toLowerCase()) return;
    try {
      await removePlayerFromGame(id, user);
    } catch (err) {
      if (isFirestorePermissionError(err)) {
        console.warn(
          'removePlayerFromGame: Firestore denied — roster updated locally only until rules allow writes.',
          err,
        );
      } else {
        console.error('removePlayerFromGame failed', err);
        setLoginError('Could not leave game. Check Firestore rules.');
        return;
      }
    }
    setGames((prev) => leaveGame(id, user, prev));
    setJoinedGame((current) => (current?.id === id ? null : current));
  }

  async function handleCancelGame(id: string) {
    if (!user) return;
    const target = games.find((g) => g.id === id);
    if (!target || target.organizer.toLowerCase() !== user.email.toLowerCase()) return;
    try {
      await deleteGameFromFirestore(id);
    } catch (err) {
      console.error('deleteGameFromFirestore failed', err);
      setLoginError('Could not cancel game. Check Firestore rules.');
      return;
    }
    setGames((prev) => prev.filter((g) => g.id !== id));
    setJoinedGame((current) => (current?.id === id ? null : current));
    if (detailGameId === id) navigate(paths.games);
  }

  async function handleCreateGame() {
    if (!user) {
      setShowLogin(true);
      return;
    }
    const draftWithOrganizer = { ...draft, organizer: user.email };
    let result: Awaited<ReturnType<typeof createGame>>;
    try {
      result = await createGame(draftWithOrganizer, games);
    } catch (err) {
      console.error('createGame failed', err);
      setLoginError('Could not create game. Check Firestore rules and sign-in.');
      return;
    }
    if (result.conflict) {
      setCreateConflictGame(result.conflict);
      return;
    }
    setCreateConflictGame(null);
    const created = result.game;
    if (created) {
      setGames((prev) => [...prev, created]);
      setDraft(emptyDraft);
      if (isSessionOnlyGameId(created.id)) {
        setPersistenceWarning(
          'This game was not saved to Firestore (write was denied or Firebase is misconfigured). It will disappear after refresh. In Firebase Console, publish rules that allow create on `games` and confirm your `.env` project matches that project.',
        );
      }
      navigateTo('find');
    }
  }

  function handleViewConflictGame(id: string) {
    setCreateConflictGame(null);
    openGameDetail(id);
  }

  const mapsUrl = (location: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location + ', Northwestern University, Evanston, IL')}`;

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

  const welcomeFirstName = user?.name?.trim().split(/\s+/)[0] ?? null;

  const homeSection = (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-cream sm:text-4xl">
          {welcomeFirstName
            ? `Welcome back, ${welcomeFirstName}.`
            : user
              ? 'Welcome back.'
              : 'Welcome'}
        </h1>
        <p className="text-sm leading-relaxed text-cream-muted sm:text-base">
          {user
            ? 'Pickup runs on campus all week — grab a spot before courts fill up.'
            : 'Sign in to join a game and see what is happening on campus.'}
        </p>
      </header>

      <Button
        variant="primary"
        className="mt-8 min-h-[48px] justify-center px-8 sm:w-auto"
        type="button"
        onClick={() => navigateTo('find')}
      >
        Browse all games
      </Button>

      <section
        className="mt-14 border-t border-white/10 pt-10"
        aria-labelledby="home-happening-heading"
      >
        <h2
          id="home-happening-heading"
          className="text-lg font-black text-cream sm:text-xl"
        >
          Happening soon
        </h2>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch">
          {homeHappeningBySport.map(({ sport, game }) =>
            game ? (
              <button
                key={sport}
                type="button"
                onClick={() => openGameDetail(game.id)}
                className="w-full rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.85)] p-5 text-left shadow-[0_12px_40px_rgba(2,8,18,0.35)] transition hover:border-brand-400/35 hover:shadow-[0_16px_48px_rgba(2,8,18,0.45)] sm:w-64 sm:shrink-0"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand-400">
                  {sportHomeCategoryLabel(sport)}
                </p>
                <p className="mt-3 line-clamp-2 text-base font-bold leading-snug text-cream">
                  {homeGameCardTitle(game)}
                </p>
                <p className="mt-3 text-sm text-cream-muted">
                  {formatHomeCardDateTime(game.startTime)}
                </p>
              </button>
            ) : (
              <button
                key={sport}
                type="button"
                onClick={() => {
                  setSportFilter(sport);
                  navigateTo('find');
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-[0_12px_40px_rgba(2,8,18,0.2)] transition hover:border-brand-400/25 sm:w-64 sm:shrink-0"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand-400">
                  {sportHomeCategoryLabel(sport)}
                </p>
                <p className="mt-3 text-base font-bold text-cream-muted">
                  No upcoming games
                </p>
                <p className="mt-3 text-sm text-cream-muted/80">
                  Browse {sport} on Games
                </p>
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => {
              setSportFilter('All');
              navigateTo('find');
            }}
            className="flex w-full items-center justify-center rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.85)] p-5 text-center shadow-[0_12px_40px_rgba(2,8,18,0.35)] transition hover:border-brand-400/35 hover:shadow-[0_16px_48px_rgba(2,8,18,0.45)] sm:w-64 sm:shrink-0 sm:min-h-[188px]"
          >
            <span className="text-base font-bold text-cream">{'More games ->'}</span>
          </button>
        </div>
      </section>
    </div>
  );

  const findSection = (
    <div className="space-y-10 py-12">
      {persistenceWarning && (
        <div
          className="flex flex-col gap-3 rounded-2xl border border-amber-400/45 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="min-w-0 flex-1 leading-relaxed">{persistenceWarning}</p>
          <button
            type="button"
            onClick={() => setPersistenceWarning(null)}
            className="shrink-0 rounded-xl border border-amber-400/50 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-500/20"
          >
            Dismiss
          </button>
        </div>
      )}
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
              onCancel={handleCancelGame}
              onOpenDetail={openGameDetail}
              isPast={isPastGame(game)}
              isJoined={isJoinedByUser(game)}
              isOrganizer={isUserOrganizer(game)}
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
        />
      )}
    </div>
  );

  const profileSection = (
    <div className="py-12">
      <div className="mb-8 max-w-3xl space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-cream sm:text-4xl">
          My Games
        </h1>
        <p className="text-sm leading-relaxed text-cream-muted sm:text-base">
          Every game you have joined, with roster details and quick access to the game
          page.
        </p>
      </div>

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
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 md:grid-cols-4">
              <div>
                <p className="text-3xl font-black text-cream">{signedUpGames.length}</p>
                <p className="text-sm font-semibold text-cream-muted">Signed up</p>
              </div>
              <div>
                <p className="text-3xl font-black text-cream">
                  {signedUpUpcoming.length}
                </p>
                <p className="text-sm font-semibold text-cream-muted">Upcoming</p>
              </div>
              <div>
                <p className="text-3xl font-black text-cream">{signedUpPast.length}</p>
                <p className="text-sm font-semibold text-cream-muted">Past</p>
              </div>
              <div>
                <p className="text-3xl font-black text-cream">{gamesHosted}</p>
                <p className="text-sm font-semibold text-cream-muted">Games hosted</p>
              </div>
            </div>
          )}

          <section>
            <h3 className="text-lg font-bold text-cream">All of your games</h3>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              {user && signedUpGames.length > 0 ? (
                signedUpGames.map((game) => (
                  <SignedUpGameCard
                    key={game.id}
                    game={game}
                    mapsUrl={mapsUrl}
                    isPast={isPastGame(game)}
                    isOrganizer={isUserOrganizer(game)}
                    onOpenDetail={openGameDetail}
                    onLeave={handleLeaveGame}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[rgba(9,15,24,0.55)] p-6 text-sm text-cream-muted">
                  {user
                    ? 'You are not signed up for any games yet. Browse open games to join one.'
                    : 'Sign in to see the games you have joined.'}
                </div>
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
        currentUser={user}
        mapsUrl={mapsUrl}
        isJoined={isJoinedByUser(detailGame)}
        isPast={isPastGame(detailGame)}
        isOrganizer={isUserOrganizer(detailGame)}
        onJoin={handleJoinGame}
        onLeave={handleLeaveGame}
        onCancel={handleCancelGame}
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

  const routeMain = (
    <Routes>
      <Route path={paths.home} element={homeSection} />
      <Route path={paths.games} element={findSection} />
      <Route path={`${paths.games}/:gameId`} element={gameDetailSection} />
      <Route path={paths.host} element={createSection} />
      <Route path={paths.profile} element={profileSection} />
      <Route
        path="/profile/:userId"
        element={<ProfilePage currentUser={user} games={games} />}
      />
      <Route
        path={paths.settings}
        element={
          user ? (
            <SettingsPage currentUser={user} onLogout={handleLogout} />
          ) : (
            <Navigate to={paths.home} replace />
          )
        }
      />
      <Route path={paths.notifications} element={notificationsPage} />
      <Route path="*" element={<Navigate to={paths.home} replace />} />
    </Routes>
  );

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
        activeView={activeView}
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
        {!isFirebaseConfigured() && (
          <div
            className="mb-6 rounded-2xl border border-sky-accent/40 bg-sky-accent/10 px-4 py-3 text-sm leading-relaxed text-cream"
            role="status"
          >
            Firebase is not configured in this build (missing{' '}
            <code className="rounded bg-white/10 px-1">VITE_FIREBASE_*</code> in{' '}
            <code className="rounded bg-white/10 px-1">.env</code>). The list shows
            bundled sample games only; nothing is read from or written to your database.
          </div>
        )}
        {isFirebaseConfigured() && firestorePermissionBanner && (
          <div
            className="mb-6 rounded-2xl border border-red-400/45 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-100"
            role="alert"
          >
            <p className="font-bold text-red-50">Cannot read your Firestore database</p>
            <p className="mt-2">{firestorePermissionBanner}</p>
            <button
              type="button"
              className="mt-3 text-xs font-bold text-red-200 underline underline-offset-2 hover:text-cream"
              onClick={() => setFirestorePermissionBanner(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        {routeMain}
      </main>

      <BottomTabBar activeView={activeView} onNavigate={navigateTo} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
        }}
      />

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
            aria-labelledby="joined-game-heading"
            aria-describedby="joined-game-summary"
          >
            <h2
              id="joined-game-heading"
              className="text-2xl font-black tracking-tight text-cream sm:text-3xl"
            >
              You&apos;re in!
            </h2>
            <p
              id="joined-game-summary"
              className="mt-2 text-lg font-bold text-cream sm:text-xl"
            >
              {joinedGame.sport} at {joinedGame.location}
            </p>
            <p className="mt-1 text-sm font-semibold text-brand-400">
              {formatGameTime(joinedGame.startTime)}
            </p>

            <dl className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <dt className="shrink-0 font-semibold text-cream-muted">Host</dt>
                <dd className="min-w-0 text-right">
                  {isUserOrganizer(joinedGame) ? (
                    <a
                      href={`mailto:${joinedGame.organizer}`}
                      className="break-all font-semibold text-sky-accent hover:underline"
                    >
                      {joinedGame.organizer}
                    </a>
                  ) : (
                    <span className="font-semibold text-cream">
                      {joinedGame.organizer.split('@')[0] || 'Host'}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <dt className="shrink-0 font-semibold text-cream-muted">Location</dt>
                <dd className="min-w-0 text-right">
                  <a
                    href={mapsUrl(joinedGame.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline font-semibold text-sky-accent hover:underline"
                  >
                    {joinedGame.location} → Google Maps ↗
                  </a>
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <dt className="shrink-0 font-semibold text-cream-muted">Players</dt>
                <dd className="font-semibold text-cream">
                  {joinedGame.players.length}/{joinedGame.capacity}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-cream-muted">
                Participants
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {joinedGame.players.map((p) => {
                  const shortName = p.name.trim().split(/\s+/)[0] || p.name;
                  return (
                    <li
                      key={p.email}
                      className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-cream"
                    >
                      {shortName}
                    </li>
                  );
                })}
              </ul>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-cream-muted">
              Your email has been shared with the host.
            </p>

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
