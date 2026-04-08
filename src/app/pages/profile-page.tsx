import { Link } from 'react-router';

import { AppCard } from '../components/ui/app-card';
import { useAuth } from '../context/auth-context';
import { useGames } from '../context/games-context';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const { games } = useGames();

  const joined = games.filter((g) => user && g.players.includes(user.displayName));
  const hosted = games.filter((g) => user && g.hostName === user.displayName);
  const inferredInterests = Array.from(
    new Set([...joined.map((g) => g.sport), ...hosted.map((g) => g.sport)]),
  ).slice(0, 5);
  const now = Date.now();
  const toStartMs = (date: string, time: string) => Date.parse(`${date} ${time}`);
  const joinedWithTime = joined
    .map((g) => ({ game: g, startMs: toStartMs(g.date, g.time) }))
    .filter((x) => !Number.isNaN(x.startMs));

  const upcoming = joinedWithTime
    .filter((x) => x.startMs >= now)
    .sort((a, b) => a.startMs - b.startMs)
    .map((x) => x.game);
  const past = joinedWithTime
    .filter((x) => x.startMs < now)
    .sort((a, b) => b.startMs - a.startMs)
    .map((x) => x.game);

  const initials =
    user?.displayName
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? 'NU';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10 lg:px-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <aside className="lg:col-span-4">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-light text-2xl font-bold text-brand">
              {initials}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-text-primary">
              {user?.displayName ?? 'Student'}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {user?.email ?? 'you@u.northwestern.edu'}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              {inferredInterests.length > 0 ? (
                inferredInterests.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-text-muted">No sports activity yet</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-8 text-sm text-text-muted transition-colors hover:text-red-500"
            >
              Sign Out
            </button>
          </div>
        </aside>

        <div className="space-y-10 lg:col-span-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <AppCard className="p-5 text-center sm:p-6 sm:text-left">
              <p className="text-3xl font-black text-text-primary">{joined.length}</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">Games Joined</p>
              <p className="text-xs text-text-muted">All time</p>
            </AppCard>
            <AppCard className="p-5 text-center sm:p-6 sm:text-left">
              <p className="text-3xl font-black text-text-primary">{hosted.length}</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">Games Hosted</p>
              <p className="text-xs text-text-muted">All time</p>
            </AppCard>
          </div>

          <section>
            <h2 className="text-lg font-bold text-text-primary">Upcoming</h2>
            <div className="mt-4 space-y-3">
              {upcoming.length > 0 ? (
                upcoming.map((g) => (
                  <Link key={g.id} to={`/games/${g.id}`}>
                    <AppCard className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-text-primary">{g.title}</p>
                        <p className="text-sm text-text-secondary">
                          {g.sport} · {g.location}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-text-primary">
                        {g.date} · {g.time}
                      </p>
                    </AppCard>
                  </Link>
                ))
              ) : (
                <AppCard className="p-4 text-sm text-text-secondary">
                  You have no upcoming joined games.
                </AppCard>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">Past games</h2>
            <div className="mt-4 space-y-3">
              {past.length > 0 ? (
                past.map((g) => (
                  <AppCard
                    key={g.id}
                    className="flex flex-col gap-1 p-4 opacity-90 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-text-primary">{g.title}</p>
                      <p className="text-sm text-text-secondary">
                        {g.sport} · {g.location}
                      </p>
                    </div>
                    <p className="text-sm text-text-muted">
                      {g.date} · {g.time}
                    </p>
                  </AppCard>
                ))
              ) : (
                <AppCard className="p-4 text-sm text-text-secondary">
                  You have no past joined games.
                </AppCard>
              )}
            </div>
          </section>

          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full text-center text-sm text-text-muted transition-colors hover:text-red-500 lg:hidden"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
