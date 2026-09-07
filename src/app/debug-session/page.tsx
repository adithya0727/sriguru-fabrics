// TEMPORARY diagnostic. Delete once the login issue is resolved.
// Deliberately outside /admin so the auth gate doesn't redirect it away.
import { cookies, headers } from 'next/headers';
import { getSessionClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DebugSession() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const all = cookieStore.getAll();

  const supabase = await getSessionClient();
  const { data, error } = await supabase.auth.getUser();

  return (
    <main style={{ font: '14px system-ui', padding: 20, lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 18 }}>Session diagnostic</h1>

      <h2 style={{ fontSize: 15, marginTop: 20 }}>What the server sees</h2>
      <p>
        Host: <code>{headerStore.get('host')}</code>
      </p>
      <p>
        Cookies received: <strong>{all.length}</strong>
      </p>
      <ul>
        {all.map((c) => (
          <li key={c.name}>
            <code>{c.name}</code> — {c.value.length} chars
          </li>
        ))}
      </ul>
      {all.length === 0 && (
        <p style={{ color: '#b00' }}>
          No cookies at all reached the server. The browser is not sending
          them.
        </p>
      )}

      <h2 style={{ fontSize: 15, marginTop: 20 }}>Auth check</h2>
      <p>
        User: <strong>{data.user ? data.user.email : 'none'}</strong>
      </p>
      {error && (
        <p style={{ color: '#b00' }}>
          Error: {error.message} ({error.status})
        </p>
      )}

      <h2 style={{ fontSize: 15, marginTop: 20 }}>What the browser holds</h2>
      <pre
        id="clientCookies"
        style={{ background: '#f3f3f3', padding: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            var raw = document.cookie;
            var names = raw ? raw.split(';').map(function(c){return c.split('=')[0].trim();}) : [];
            document.getElementById('clientCookies').textContent =
              names.length ? names.join('\\n') : '(document.cookie is empty)';
          `,
        }}
      />
    </main>
  );
}
