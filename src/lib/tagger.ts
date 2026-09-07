/**
 * Server-only re-export of the tagger.
 *
 * The logic lives in tagger-core.ts so the migration script can import it
 * from plain Node. This file exists to make the `server-only` guard apply to
 * anything reached from the Next.js app — if the tagger is ever imported into
 * a client component by mistake, the build fails loudly instead of shipping
 * the system prompt to the browser.
 */
import 'server-only';

export { tagSareePhotos } from './tagger-core';
export type { TagResult } from './tagger-core';
