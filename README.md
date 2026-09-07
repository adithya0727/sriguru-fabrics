# Sri Guru Raya Fabrics

Stock register and shareable catalogue for a family saree business in
Chikkalasandra, Bangalore.

## The idea

Customers never install anything. Sarees are shared as **links on WhatsApp**,
not as photos. A link stays correct on its own: when a saree sells, a message
sent three weeks earlier updates itself to show it's gone, along with what else
is available. Photos can't do that, which is what makes an inventory built on
WhatsApp captions unmaintainable.

Three surfaces, one database:

| Surface | Who | Purpose |
|---|---|---|
| `/admin` | Family, on phones | Add a saree in ~30 seconds, mark sold in one tap |
| `/s/[id]` | Customers | The link that gets shared. Live, so it never goes stale |
| `/admin/dashboard` | Family | Profit, dead stock, what's worth buying more of |

## Adding a saree

Photograph the saree, the border and the pallu. The photos upload while
Claude reads them and fills in the name, description, type, fabric, colours,
border, motifs and tags — in the shop's own vocabulary, from
`src/lib/vocabulary.ts`.

The only fields left empty are the selling price and what was paid. Anything
the model was unsure about (fabric is genuinely hard to judge from a
photograph) is flagged in amber for a person to check.

## Cost prices are private

`cost_price` and `supplier` must never reach a public page. The rule is
enforced in one place: `PUBLIC_COLUMNS` in `src/lib/queries.ts`. Every public
read goes through that file, and no anonymous database role can read any table
directly — public pages are rendered by the server.

If you add a public page, use the helpers in `queries.ts`. Don't query Supabase
from a public client component.

## Running it

See [SETUP.md](SETUP.md). Short version:

```bash
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev
```

## Stack

Next.js 16 (App Router) · Supabase (Postgres, Storage, Auth) · Tailwind 4 ·
Claude Opus 5 for photo tagging.

Server-rendered per request, which is what generates the WhatsApp preview cards
and keeps shared links honest.
