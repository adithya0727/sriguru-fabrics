/**
 * House vocabulary, lifted from the words already used across the original
 * 68 listings. The tagger is told to prefer these, so descriptions come out
 * sounding like the shop rather than like a generic e-commerce site — a
 * customer reading "semi silk with golden butta" recognises the shop's voice;
 * "elegant traditional handloom drape" reads like it came from a template.
 */

export const CATEGORIES = ['Gadwal', 'Ilkal', 'Soft Silk', 'Fancy'] as const;

export const FABRICS = [
  'pure silk',
  'semi silk',
  'soft silk',
  'cotton',
  'cotton silk',
] as const;

export const BORDERS = [
  'bentex border',
  'temple border',
  'zari border',
  'chex border',
  'contrast border',
  'plain border',
] as const;

export const MOTIFS = [
  'butta',
  'golden butta',
  'worli print',
  'chex',
  'small chex',
  'stripes',
  'plain',
  'floral',
  'peacock',
] as const;

export const OCCASIONS = [
  'daily wear',
  'office wear',
  'festive',
  'wedding',
  'gifting',
] as const;

/** Category notes that materially improve the model's guesses. */
export const CATEGORY_NOTES = `
- Gadwal: cotton or semi-silk body with a distinctly heavier silk border and
  pallu, often with zari. The border/body contrast is the identifying feature.
- Ilkal: cotton or cotton-silk body with a pallu in a strongly contrasting
  colour (classically red), often with a distinctive woven join at the pallu.
- Soft Silk: lighter, fluid silk with a soft sheen and good drape.
- Fancy: printed or synthetic-blend pieces that are not a traditional handloom
  type. Use this only when the saree is clearly not one of the three above.
`.trim();

/** Words that must never end up in a listing. */
export const BANNED_PHRASES = [
  'exquisite',
  'stunning',
  'gorgeous',
  'must-have',
  'elevate your wardrobe',
  'timeless elegance',
  'a piece of art',
];
