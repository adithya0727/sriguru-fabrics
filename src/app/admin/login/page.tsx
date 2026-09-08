'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = getBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Show what actually went wrong. A single catch-all message here makes
      // real problems (provider disabled, unconfirmed email, network) look
      // identical to a typo, which wastes a lot of time.
      setError(
        error.code === 'invalid_credentials'
          ? 'That email or password is not right. Please try again.'
          : `${error.message}${error.code ? ` (${error.code})` : ''}`,
      );
      setBusy(false);
      return;
    }

    if (!data.session) {
      setError('Signed in, but no session was returned. Please try again.');
      setBusy(false);
      return;
    }

    // The sign-in call resolves before the auth cookie is guaranteed readable
    // by the server. Navigating immediately can race the cookie write, and the
    // proxy then bounces straight back here — which looks like the login
    // silently did nothing. Confirm the session reads back first.
    const { data: check } = await supabase.auth.getSession();
    if (!check.session) {
      setError(
        'Your browser did not keep the login cookie. If this is a private ' +
          'window, try a normal one; otherwise check that cookies are allowed.',
      );
      setBusy(false);
      return;
    }

    router.push(params.get('next') ?? '/admin');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rise">
        <div className="text-center mb-8">
          <p className="eyebrow mb-3">Stock register</p>
          <h1 className="font-display text-2xl leading-tight text-maroon-900">
            Sri Guru Raghavendra
            <span className="block text-maroon-700">Fabrics</span>
          </h1>
        </div>

        <div className="card p-6">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            className="field mb-4"
          />

          <label
            htmlFor="password"
            className="block text-sm font-medium text-ink mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="field mb-5"
          />

          {error && (
            <p
              role="alert"
              className="text-sm text-bad bg-bad-bg border border-bad/20 rounded-lg px-3 py-2.5 mb-4 leading-relaxed"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </main>
  );
}
