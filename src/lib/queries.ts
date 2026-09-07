import 'server-only';
import { getAdminClient } from './supabase/server';
import type { PublicSaree } from './types';

/**
 * The ONLY column list a public page may select.
 *
 * cost_price, supplier, purchased_on and quantity_total are deliberately
 * absent. Every public read in the app goes through the helpers below, so this
 * one constant is the whole privacy boundary — if you need to audit whether a
 * cost price can leak, this line is the audit.
 */
const PUBLIC_COLUMNS =
  'id, name, description, category, photos, fabric, colors, border, ' +
  'motifs, tags, has_blouse, occasion, price, quantity_available, ' +
  'created_at, updated_at';

/** One saree for its shareable page. Returns sold-out sarees too — the page
 *  needs to render the "sold" state rather than 404, so old WhatsApp links
 *  stay meaningful instead of breaking. */
export async function getPublicSaree(id: string): Promise<PublicSaree | null> {
  const { data, error } = await getAdminClient()
    .from('sarees')
    .select(PUBLIC_COLUMNS)
    .eq('id', id)
    .returns<PublicSaree[]>()
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/** In-stock sarees for the browsable catalog. */
export async function listPublicSarees(opts?: {
  category?: string;
  limit?: number;
}): Promise<PublicSaree[]> {
  let q = getAdminClient()
    .from('sarees')
    .select(PUBLIC_COLUMNS)
    .gt('quantity_available', 0)
    .order('created_at', { ascending: false });

  if (opts?.category) q = q.eq('category', opts.category);
  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q.returns<PublicSaree[]>();
  if (error) throw error;
  return data ?? [];
}

/** Shown on a sold saree's page so a stale link becomes a recommendation
 *  instead of a dead end. Same category first, then anything in stock. */
export async function getSimilarSarees(
  saree: PublicSaree,
  limit = 4,
): Promise<PublicSaree[]> {
  const client = getAdminClient();

  const { data: sameCategory } = await client
    .from('sarees')
    .select(PUBLIC_COLUMNS)
    .eq('category', saree.category)
    .neq('id', saree.id)
    .gt('quantity_available', 0)
    .limit(limit)
    .returns<PublicSaree[]>();

  const results = sameCategory ?? [];
  if (results.length >= limit) return results;

  const { data: filler } = await client
    .from('sarees')
    .select(PUBLIC_COLUMNS)
    .neq('id', saree.id)
    .neq('category', saree.category)
    .gt('quantity_available', 0)
    .limit(limit - results.length)
    .returns<PublicSaree[]>();

  return [...results, ...(filler ?? [])];
}

export async function listCategories(): Promise<string[]> {
  const { data, error } = await getAdminClient()
    .from('categories')
    .select('name')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []).map((r) => r.name as string);
}
