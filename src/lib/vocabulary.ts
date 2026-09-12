/**
 * House vocabulary, lifted from the words already used across the original
 * 68 listings. The tagger is told to prefer these, so descriptions come out
 * sounding like the shop rather than like a generic e-commerce site — a
 * customer reading "semi silk with golden butta" recognises the shop's voice;
 * "elegant traditional handloom drape" reads like it came from a template.
 */

export const CATEGORIES = [
  'Gadwal',
  'Ilkal',
  'Paithani',
  'Soft Silk',
  'Cotton',
  'Chiffon',
  'Fancy',
] as const;

export const FABRICS = [
  'pure silk',
  'semi silk',
  'soft silk',
  'cotton',
  'cotton silk',
  'chiffon',
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
- Paithani: Maharashtra silk handloom, identified by its pallu — heavy gold
  zari carrying figurative motifs, usually peacocks, parrots or a lotus,
  against a plain or butta-scattered body. Borders often carry an angled
  square pattern, and the body can appear to shift colour in the light.
- Soft Silk: lighter, fluid silk with a soft sheen and good drape.
- Cotton: plain cotton with a visible weave and no sheen at all. Use this only
  for cotton sarees that are not one of the named handloom types above —
  Gadwal and Ilkal often have cotton bodies and still belong under their own
  name, so judge the type before the material.
- Chiffon: sheer and weightless, slightly see-through, with no stiffness at
  all — it hangs straight down instead of holding a shape. Usually printed,
  sometimes with sequin or thread work.
- Fancy: printed or synthetic-blend pieces that are not a traditional handloom
  type. Use this only when the saree is clearly not one of the types above.
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
