import { NextResponse } from 'next/server';
import { getSessionClient } from '@/lib/supabase/server';
import { readReceipt } from '@/lib/receipts';

export const maxDuration = 60;

const MAX_BASE64_BYTES = 2_000_000; // ~1.5MB of image; a 1024px JPEG is well under

/**
 * Reads a photographed bill and returns it as a table.
 *
 * Signed-in family only — this spends money per call, and the thing it reads
 * is supplier pricing.
 */
export async function POST(request: Request) {
  const supabase = await getSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  let body: { image?: { base64?: string; mediaType?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const image = body.image;
  if (!image || typeof image.base64 !== 'string') {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
  }
  if (image.base64.length > MAX_BASE64_BYTES) {
    return NextResponse.json(
      { error: 'That photo is too large — it should be downscaled first' },
      { status: 400 },
    );
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mediaType ?? '')) {
    return NextResponse.json(
      { error: `Unsupported image type: ${image.mediaType}` },
      { status: 400 },
    );
  }

  try {
    const result = await readReceipt(
      image as { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' },
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reading the bill failed:', error);
    const message =
      error instanceof Error ? error.message : 'Could not read this bill';
    // Never fatal: the form stays usable and the details can be typed in.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
