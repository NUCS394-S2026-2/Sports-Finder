import { Link } from 'react-router';

import { PrimaryButton } from '../components/ui/app-buttons';
import { AppCard } from '../components/ui/app-card';
import { useAuth } from '../context/auth-context';
import { useGames } from '../context/games-context';

export function HomePage() {
  const { user } = useAuth();
  const { games } = useGames();
  const featured = games.filter((g) => !g.cancelled).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10 lg:px-16">
      <h1 className="text-3xl font-black text-text-primary sm:text-4xl">
        Welcome back, {user?.displayName?.split(' ')[0] ?? 'Wildcat'}.
      </h1>
      <p className="mt-2 max-w-xl text-text-secondary">
        Pickup runs on campus all week — grab a spot before courts fill up.
      </p>
      <Link to="/games" className="mt-8 inline-block">
        <PrimaryButton className="min-h-[48px] px-8">Browse all games</PrimaryButton>
      </Link>

      <h2 className="mt-14 text-lg font-bold text-text-primary">Happening soon</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((g) => (
          <Link key={g.id} to={`/games/${g.id}`}>
            <AppCard className="h-full p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
              <p className="text-sm font-semibold text-brand">{g.sport}</p>
              <p className="mt-1 font-semibold text-text-primary">{g.title}</p>
              <p className="mt-2 text-sm text-text-secondary">
                {g.date} · {g.time}
              </p>
            </AppCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
