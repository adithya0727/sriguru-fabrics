/**
 * The public base URL, used to build shareable WhatsApp links.
 *
 * Resolved rather than hard-coded so a deployment doesn't need a manual fix-up
 * after its first build: Vercel injects the production domain itself, and
 * getting this wrong is silent — links still generate, they just point
 * somewhere unreachable.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  // Set by Vercel to the stable production domain (not the per-deploy URL).
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}
