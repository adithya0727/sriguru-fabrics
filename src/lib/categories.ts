/**
 * Category names carry spaces — "Soft Silk" — which make for poor links. The
 * slug is what ends up in a WhatsApp message, so it has to be short, readable
 * and stable: /c/soft-silk, not /c/Soft%20Silk.
 */
export function categorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolve a slug back to the real category name, which is what the database
 * stores. Returns null for anything that isn't a known category, so a made-up
 * URL 404s rather than running a query built from it.
 */
export function categoryFromSlug(
  slug: string,
  categories: string[],
): string | null {
  const target = categorySlug(slug);
  return categories.find((c) => categorySlug(c) === target) ?? null;
}
