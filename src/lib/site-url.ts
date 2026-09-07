/**
 * The public base URL, used to build shareable WhatsApp links.
 *
 * Resolved rather than hard-coded, because getting it wrong fails silently:
 * links still generate, they just point somewhere unreachable. Each host
 * exposes its own domain under a different variable name, so check all of
 * them and fall back in order of trustworthiness.
 */
export function getSiteUrl(): string {
  // An explicit setting always wins — needed once a custom domain is live but
  // the platform still reports its own subdomain as primary.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalise(explicit);

  // Netlify: the site's main URL, custom domain included once attached.
  if (process.env.NETLIFY && process.env.URL) return normalise(process.env.URL);

  // Vercel: the stable production domain, not the per-deployment URL.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return normalise(vercel);

  return 'http://localhost:3000';
}

function normalise(url: string): string {
  const withScheme = /^https?:\/\//.test(url) ? url : `https://${url}`;
  return withScheme.replace(/\/+$/, '');
}
