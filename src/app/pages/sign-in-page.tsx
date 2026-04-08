import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { PrimaryButton } from '../components/ui/app-buttons';
import { AppCard } from '../components/ui/app-card';
import { useAuth } from '../context/auth-context';

export function SignInPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/home';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const isValidSignupPassword = (value: string) =>
    value.length >= 6 && /[A-Za-z]/.test(value) && /\d/.test(value);

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === 'signup' && !isValidSignupPassword(password)) {
      toast.error(
        'Password must be at least 6 characters and include letters and numbers.',
      );
      return;
    }
    try {
      await signIn(email.trim(), password, mode);
      navigate(next, { replace: true });
    } catch {
      toast.error(
        mode === 'signup'
          ? 'Could not create account. Try a stronger password.'
          : 'Could not sign in. Check email and password.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-10 pt-8 text-text-primary sm:px-6 md:px-10">
      <div className="mx-auto mt-8 max-w-md md:mt-20">
        <Link
          to="/home"
          className="mb-8 inline-block text-sm font-medium text-text-secondary hover:text-brand"
        >
          ← Back
        </Link>
        <div className="mb-8 text-center">
          <Link to="/home" className="inline-flex items-center gap-2 text-xl font-bold">
            Pickup Sports Finder
            <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
          </Link>
        </div>
        <AppCard className="p-6 sm:p-8">
          <h1 className="text-center text-2xl font-bold text-text-primary">
            Sign in to join the game.
          </h1>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@u.northwestern.edu"
                className="app-input"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-text-secondary"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="app-input"
                required
              />
            </div>
            <PrimaryButton type="submit" className="mt-2 w-full min-h-[48px]">
              {mode === 'signin' ? 'Sign In' : 'Create account'}
            </PrimaryButton>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-brand hover:text-brand-dark"
                  onClick={() => setMode('signup')}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="font-semibold text-brand hover:text-brand-dark"
                  onClick={() => setMode('signin')}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </AppCard>
      </div>
    </div>
  );
}
