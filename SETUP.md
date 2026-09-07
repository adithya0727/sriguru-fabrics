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

In the Supabase dashboard, open **SQL Editor** and run these two files, in
order:

1. `supabase/schema.sql` — tables, the one-tap sale function, reporting views,
   and row-level security
2. `supabase/storage.sql` — the photo bucket and its access rules

Paste the whole file, press Run, confirm it says success, then do the second.

## 3. Create logins for the family

**Authentication → Users → Add user** for each person who will add stock.
Use "Auto Confirm User" so there's no email verification step.

Suggested: one account each rather than a shared login, so the stock register
shows who did what if something looks wrong later.

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
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for now | Becomes the real domain after deploying |

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
3. Deploy, then set `NEXT_PUBLIC_SITE_URL` to the real URL and redeploy —
   shareable links are built from it, so until it's right they'll point at
   localhost.

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

## What the tagging costs

Roughly **$0.015 per saree** — two photos downscaled to 768px, plus a cached
system prompt. Your $5 covers about 300 sarees.

If that ever needs to come down, the levers in order are: send one photo
instead of two, or try `claude-haiku-4-5` in `src/lib/tagger-core.ts` and
compare the results on a few sarees before committing to it.
