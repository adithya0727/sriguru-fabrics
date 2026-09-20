/**
 * Server-only re-export of the bill reader, mirroring tagger.ts.
 *
 * The guard matters here more than it does for sarees: this system prompt and
 * the API key behind it must never reach a browser, and bills are the most
 * sensitive thing in the app.
 */
import 'server-only';

export { readReceipt } from './receipt-core';
export type { ExtractedReceipt, ReceiptResult } from './receipt-core';
