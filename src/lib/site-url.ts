import 'server-only';
import { headers } from 'next/headers';

/**
 * The public base URL, used to build shareable WhatsApp links.
 *
 * Derived from the incoming request first, because that is the one source
 * which cannot be stale: whatever domain the page was actually served on is
 * the domain its links should point at. Configuration is a fallback rather
 * than the primary answer — a wrong value here fails silently, and the
 * failure only surfaces once a link is already sitting in someone's chat.
 */
export async function getSiteUrl(): Promise<string> {
  const fromRequest = await requestOrigin();

  // An explicit setting still wins, so a canonical domain can be forced when
  // the site answers on several. The exception is a leftover localhost value
  // on a deployed site: that is never what anyone meant, and it is exactly
  // what puts "localhost:3000" into a WhatsApp message.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit && !(fromRequest && isLoopback(explicit))) return normalise(explicit);

  if (fromRequest) return fromRequest;

  // No request to read from — a build-time render, or a script.
  if (process.env.NETLIFY && process.env.URL) return normalise(process.env.URL);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return normalise(vercel);

  return 'http://localhost:3000';
}

/** The origin this request actually arrived on, or null outside a request. */
async function requestOrigin(): Promise<string | null> {
  let host: string | null;
  let proto: string | null;

  try {
    const list = await headers();
    // Behind Netlify's proxy the original host is forwarded; `host` is the
    // internal one. Prefer the forwarded value when it is there.
    host = firstValue(list.get('x-forwarded-host') ?? list.get('host'));
    proto = firstValue(list.get('x-forwarded-proto'));
  } catch {
    return null;
  }

  if (!host) return null;
  return normalise(`${proto ?? (isLoopback(host) ? 'http' : 'https')}://${host}`);
}

/** Proxies append to these headers rather than replacing them, so a chained
 *  request arrives as "first, second". The first entry is the real client. */
function firstValue(value: string | null): string | null {
  const head = value?.split(',')[0]?.trim();
  return head ? head : null;
}

function isLoopback(urlOrHost: string): boolean {
  const host = urlOrHost.replace(/^https?:\/\//, '').split('/')[0];
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/.test(host);
}

function normalise(url: string): string {
  const withScheme = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return withScheme.replace(/\/+$/, '');
}
