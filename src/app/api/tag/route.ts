import { NextResponse } from 'next/server';
import { getSessionClient } from '@/lib/supabase/server';
import { tagSareePhotos } from '@/lib/tagger';

export const maxDuration = 60;

const MAX_IMAGES = 3;
const MAX_BASE64_BYTES = 1_500_000; // ~1.1MB of image; a 768px JPEG is far under

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

  let body: { images?: { base64: string; mediaType: string }[] };
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

  try {
    const result = await tagSareePhotos(
      images as { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[],
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Tagging failed:', error);
    const message =
      error instanceof Error ? error.message : 'Could not read these photos';
    // Deliberately not fatal to the caller: the add form stays usable and the
    // person just types the details in themselves.
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
