/**
 * The shop itself.
 *
 * One copy, because these strings were drifting across three pages and a
 * receipt makes four. A receipt with a stale phone number on it is worse than
 * one with none — it reaches a customer and looks authoritative.
 */
export const SHOP = {
  name: 'Sri Guru Raghavendra Fabrics',
  tagline: 'Handloom sarees · Chikkalasandra',
  addressLines: [
    'No.3, Puja Classic Apartments, Chikkalasandra',
    'Bangalore 560061',
  ],
  phoneDisplay: '+91 96637 33683',
  phoneDial: '+919663733683',
  /** Digits only, for wa.me links. */
  whatsapp: '919663733683',
} as const;
