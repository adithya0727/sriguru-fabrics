# Setup

One-time steps to get this running. Budget about 30 minutes.

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
   The free tier is comfortably enough — 500MB database, 1GB of photo storage,
   which is roughly 1,500 saree photos at the size this app stores them.
2. Pick the **Mumbai (ap-south-1)** region. Every user is in Bangalore, and
   this is the difference between a page that feels instant and one that
   doesn't.
3. Save the database password somewhere safe.

## 2. Create the tables

In the Supabase dashboard, open **SQL Editor** and run these files, in order:

1. `supabase/schema.sql` — tables, the one-tap sale function, reporting views,
   and row-level security
2. `supabase/storage.sql` — the photo bucket and its access rules
3. `supabase/002-family-allowlist.sql` — restricts access to an explicit list
   of people, so registering an account grants nothing on its own
4. `supabase/003-more-categories.sql` — adds Paithani, Cotton and Chiffon to
   the saree types
5. `supabase/004-store-receipts.sql` — supplier bills, and the **private**
   photo bucket they live in
6. `supabase/005-link-sarees-to-bills.sql` — links a saree to the bill line it
   was bought on, so the shop's own wording finds it later

Paste a whole file, press Run, confirm it says success, then move to the next.

On an existing database you only need the numbered files you haven't run yet;
each one is safe to re-run if you're unsure.

## 3. Create logins for the family

**Authentication → Users → Add user** for each person who will add stock.
Use "Auto Confirm User" so there's no email verification step.

One shared login is fine. Separate accounts per person would be tidier, but
nothing in the app records who added or sold what, so today they buy you only
separate passwords — not an audit trail.

Then turn **off** public signups. Without this, anyone who finds the site can
create an account, see every cost price and edit your stock.

There are two toggles on **Authentication → Sign In / Providers** and they are
easy to confuse:

| Toggle | Set it to | What it does |
|---|---|---|
| **Enable Email provider** (inside the Email box) | **ON** | Whether email/password login works at all |
| **Allow new users to sign up** (project-level, above the providers) | **OFF** | Whether strangers can register |

Turning off the first one locks out your own family — logging in fails with
`email_provider_disabled`. It's the second one you want.

## 4. Local environment

```bash
cp .env.local.example .env.local
```

Fill it in from **Project Settings → API Keys**:

| Variable | Where in the dashboard | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → Data API → **Project URL** | Safe in the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API Keys → **Publishable key** (`sb_publishable_…`) | Safe in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API Keys → **Secret key** (`sb_secret_…`) | **Server only.** Bypasses all security rules |
| `ANTHROPIC_API_KEY` | console.anthropic.com | **Server only.** Spends money per call |
| `NEXT_PUBLIC_SITE_URL` | Leave unset unless you need to force one domain | Optional. Shareable links default to the domain the page was served on |

Supabase renamed these keys: **publishable** is what older guides call `anon`,
and **secret** is what they call `service_role`. The variable names in this
project keep the older wording because that's what the Supabase libraries and
most documentation still use.

If you can't find the Project URL, it's derivable — the dashboard address bar
reads `supabase.com/dashboard/project/<project-ref>`, and your URL is
`https://<project-ref>.supabase.co`.

Never prefix the last three with `NEXT_PUBLIC_`. That prefix means "send this
to the browser", and the service role key would let anyone read cost prices.

## 5. Run it

```bash
npm run dev
```

- Shop catalogue: http://localhost:3000
- Stock register: http://localhost:3000/admin

Add one saree end to end before deploying. You want to see the tagger fill in
the details before this is in your parents' hands.

## 6. Deploy

1. Push the branch and import the repo at [vercel.com](https://vercel.com).
2. Add all five environment variables in **Settings → Environment Variables**.
3. Leave `NEXT_PUBLIC_SITE_URL` out. Shareable links are built from the
   domain the request actually arrived on, so they follow the site wherever it
   lives. Set it only to force one canonical domain when the site answers on
   several — and if you do set it, note that `NEXT_PUBLIC_` values are baked
   in at build time, so changing it needs a fresh deploy, not just a restart.

Vercel's free tier has no cold starts, which is the specific problem that made
the old Render site feel broken when a link was opened from WhatsApp.

### A domain

Worth roughly ₹800/year. A short one (`srgf.in`) is easier to read aloud and
looks less like spam in a chat than `sriguru-fabrics-xyz.vercel.app`. Add it in
Vercel under **Settings → Domains**.

## Checking the WhatsApp preview

Once deployed, send yourself a saree link. It should appear as a card with the
photo, the name and the price — not a bare grey rectangle.

WhatsApp caches previews hard. If you change a page and the old card persists,
test with a fresh saree link rather than assuming it's broken.

## What the AI costs

Both readers run on `claude-haiku-4-5`, the cheapest model with vision.
Measured, not estimated:

| | Per use | Where the model is set |
|---|---|---|
| Tagging a saree | ~$0.005 | `MODEL` in `src/lib/tagger-core.ts` |
| Reading a bill | ~$0.007 | `MODEL` in `src/lib/receipt-core.ts` |

That is about **₹0.5 each**, so $5 of credit covers roughly a thousand of them.

If bills come out misread — handwriting and faint thermal print are where Haiku
is weakest — change that one `MODEL` line to `claude-sonnet-5`. It costs about
twice as much and is markedly better on messy input.

**If you move either to a Claude 5 model, note what had to be removed for
Haiku:** adaptive thinking (`thinking: {type: 'adaptive'}`) is 4.6+ only, and
`output_config.effort` is rejected outright by Haiku 4.5. Both can come back on
a Claude 5 model; neither may be present while the model is Haiku.

Photos are sent at the size that actually helps and no larger. Sarees go at
768px, where accuracy plateaus. Bills go at 1024px, because small digits need
the detail — and no higher, because the API caps images near 1.19 megapixels,
so a bigger upload is resized away before the model ever sees it.
