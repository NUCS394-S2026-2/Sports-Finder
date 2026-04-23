import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { formatGameTime } from '../lib/datetime';
import { sportEmoji } from '../lib/sports';
import { competitiveLabel } from '../lib/sports';
import { locations } from '../data';
import toast from 'react-hot-toast';
import { paths } from '../lib/routes';

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProfilePage({ currentUser, games }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userGames, setUserGames] = useState({ joined: [], created: [] });

  const isCurrentUserProfile = currentUser && userId && currentUser.email === userId;

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;

      try {
        setLoading(true);
        const profileRef = doc(db, 'users', userId);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data());

          // Load games - filter from the games array passed as prop
          const joined = games.filter((g) =>
            g.players.some((p) => p.email.toLowerCase() === userId.toLowerCase()),
          );
          const created = games.filter(
            (g) => g.organizer.toLowerCase() === userId.toLowerCase(),
          );

          setUserGames({
            joined: joined.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
            created: created.sort(
              (a, b) => new Date(b.startTime) - new Date(a.startTime),
            ),
          });
        } else {
          // Profile doesn't exist yet; create minimal profile
          setProfile({
            userId,
            displayName: userId.split('@')[0] || 'User',
            bio: '',
          });

          // Load games even without profile
          const joined = games.filter((g) =>
            g.players.some((p) => p.email.toLowerCase() === userId.toLowerCase()),
          );
          const created = games.filter(
            (g) => g.organizer.toLowerCase() === userId.toLowerCase(),
          );

          setUserGames({
            joined: joined.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)),
            created: created.sort(
              (a, b) => new Date(b.startTime) - new Date(a.startTime),
            ),
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId, games]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-20 pt-24">
        <p className="text-cream-muted">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pb-20 pt-24">
        <p className="text-cream-muted">Profile not found</p>
        <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
          Back to Home
        </Button>
      </div>
    );
  }

  const displayName = profile.displayName || profile.userId.split('@')[0];
  const bio = profile.bio || '';
  const photoURL = profile.photoURL;

  return (
    <div className="pb-20 pt-24 md:pb-12">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-8 md:p-10">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
            {/* Avatar */}
            <div className="shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="h-24 w-24 rounded-full border-2 border-brand-400 object-cover md:h-28 md:w-28"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-brand-400 bg-gradient-to-br from-brand-500 to-brand-400 text-3xl font-extrabold text-ink md:h-28 md:w-28">
                  {initials(displayName)}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-cream md:text-4xl">{displayName}</h1>
              {bio && <p className="mt-2 text-base text-cream-muted md:text-lg">{bio}</p>}
              {isCurrentUserProfile && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(paths.settings)}
                  className="mt-4"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Games Sections */}
        <div className="grid gap-10">
          {/* Games Joined */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-cream">
              Games Joined ({userGames.joined.length})
            </h2>
            {userGames.joined.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-cream-muted">No games joined yet</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {userGames.joined.map((game) => (
                  <GameCardProfile key={game.id} game={game} />
                ))}
              </div>
            )}
          </section>

          {/* Games Created */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-cream">
              Games Created ({userGames.created.length})
            </h2>
            {userGames.created.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-cream-muted">No games created yet</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {userGames.created.map((game) => (
                  <GameCardProfile key={game.id} game={game} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function GameCardProfile({ game }) {
  const navigate = useNavigate();
  const spotsRemaining = game.capacity - game.players.length;
  const level = competitiveLabel(game.skillLevel);
  const address =
    locations[game.location]?.address || 'Northwestern campus, Evanston, IL';
  const title =
    game.note.trim().length > 0
      ? game.note.length > 48
        ? `${game.note.slice(0, 48)}…`
        : game.note
      : `${game.sport} at ${game.location}`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/games/${encodeURIComponent(game.id)}`)}
      className="flex flex-col space-y-3 rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-4 text-left transition hover:border-white/20 hover:bg-[rgba(9,15,24,0.88)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl" aria-hidden>
              {sportEmoji(game.sport)}
            </span>
            <span className="rounded-full bg-gradient-to-r from-brand-500/25 to-brand-400/20 px-2.5 py-0.5 text-xs font-bold text-brand-400 ring-1 ring-brand-400/30">
              {game.sport}
            </span>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-cream">{title}</h3>
          <p className="mt-1 text-xs text-cream-muted">{game.location}</p>
        </div>
      </div>

      <div className="space-y-2 text-xs text-cream-muted">
        <p>{formatGameTime(game.startTime)}</p>
        <p>
          {game.players.length} / {game.capacity} players
        </p>
        <span className="inline-flex rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-cream">
          {level}
        </span>
      </div>
    </button>
  );
}
