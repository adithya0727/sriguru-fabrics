'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-50" />}>
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
    // proxy then bounces straight back to this page — which looks to the user
    // like the login silently did nothing. Confirm the session is actually
    // readable back before moving on.
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
    <main className="min-h-screen flex items-center justify-center px-5 bg-brand-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-brand-100 p-6"
      >
        <h1 className="text-xl font-semibold text-brand-800">
          Sri Guru Raghavendra Fabrics
        </h1>
        <p className="text-sm text-stone-500 mt-1 mb-6">Stock register</p>

        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          className="tap-target w-full px-3 rounded-lg border border-stone-300 mb-4 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none"
        />

        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="tap-target w-full px-3 rounded-lg border border-stone-300 mb-5 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 outline-none"
        />

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="tap-target w-full rounded-lg bg-brand-700 text-white font-medium disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
