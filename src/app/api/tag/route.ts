import { NextResponse } from 'next/server';
import { getSessionClient } from '@/lib/supabase/server';
import { tagSareePhotos, type BillCandidate } from '@/lib/tagger';
import { type BillItem, parseAmount } from '@/lib/bills';

export const maxDuration = 60;

const MAX_IMAGES = 3;
const MAX_BASE64_BYTES = 1_500_000; // ~1.1MB of image; a 768px JPEG is far under

/** What a matched bill line fills in on the saree. */
type Match = {
  billId: string;
  itemName: string;
  costPrice: number | null;
  quantity: number | null;
  supplier: string | null;
  purchasedOn: string | null;
};

/**
 * Reads saree photos and returns a filled-in listing.
 *
 * Signed-in family only — this endpoint spends money on every call, so leaving
 * it open would let anyone drain the API credit.
 */
export async function POST(request: Request) {
  const supabase = await getSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let body: {
    images?: { base64: string; mediaType: string }[];
    billId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const images = body.images ?? [];

  if (images.length === 0) {
    return NextResponse.json({ error: 'No photos provided' }, { status: 400 });
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Send at most ${MAX_IMAGES} photos` },
      { status: 400 },
    );
  }
  for (const img of images) {
    if (typeof img.base64 !== 'string' || img.base64.length > MAX_BASE64_BYTES) {
      return NextResponse.json(
        { error: 'A photo was too large — it should be downscaled first' },
        { status: 400 },
      );
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(img.mediaType)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${img.mediaType}` },
        { status: 400 },
      );
    }
  }

  // The bill's lines are read here, not accepted from the caller. They decide
  // the cost price that gets written down, so they come from the database
  // under this family member's own row-level security, never from the browser.
  let bill: BillRow | null = null;
  if (typeof body.billId === 'string' && body.billId) {
    const { data } = await supabase
      .from('bills')
      .select('id, bill_date, items, bill_companies(name)')
      .eq('id', body.billId)
      .maybeSingle();
    bill = (data as BillRow | null) ?? null;
  }

  const candidates: BillCandidate[] = (bill?.items ?? []).map((item, i) => ({
    number: i + 1,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
  }));

  try {
    const result = await tagSareePhotos(
      images as { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[],
      candidates,
    );

    return NextResponse.json({
      attributes: result.attributes,
      usage: result.usage,
      match: resolveMatch(bill, result.matchedNumber),
    });
  } catch (error) {
    console.error('Tagging failed:', error);
    const message =
      error instanceof Error ? error.message : 'Could not read these photos';
    // Deliberately not fatal to the caller: the add form stays usable and the
    // person just types the details in themselves.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

type BillRow = {
  id: string;
  bill_date: string | null;
  items: BillItem[];
  // Supabase returns an embedded one-to-one either way depending on the join.
  bill_companies: { name: string } | { name: string }[] | null;
};

function resolveMatch(bill: BillRow | null, number: number | null): Match | null {
  if (!bill || number === null) return null;

  const item = bill.items[number - 1];
  if (!item) return null;

  const company = Array.isArray(bill.bill_companies)
    ? bill.bill_companies[0]
    : bill.bill_companies;

  return {
    billId: bill.id,
    itemName: item.description,
    costPrice: parseAmount(item.rate),
    quantity: parseAmount(item.quantity),
    supplier: company?.name ?? null,
    purchasedOn: bill.bill_date,
  };
}
