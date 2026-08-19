# TEETOMIC — Supabase Setup (the real backend)

Without Supabase, TEETOMIC runs on an in-memory mock that **wipes on every
serverless cold start** — great for a demo, useless for real accounts. This
makes data **persist**: course signups, golfer accounts, points, TeeCredit,
handicaps, bookings, alerts, and uploaded course photos all survive.

You only need to do this once. ~10 minutes.

## 1. Create a Supabase project
1. Go to **supabase.com** → sign in → **New project**.
2. Pick a name (e.g. `teetomic`), a strong database password, and a region
   close to Montréal (e.g. `East US` / `Canada`).
3. Wait ~2 minutes for it to provision.

## 2. Create the tables + storage bucket
1. In the project, open **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this repo, copy **all** of it, paste, **Run**.
3. You should see "Success". This creates every table plus the public
   `course-photos` storage bucket (used by the Business Corner photo uploader).

## 3. Grab your keys
In the project: **Settings → API**. Copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
  ⚠️ The service_role key is a full-access secret. It's used **server-side only**
  and must **never** be exposed to the browser or committed to git.

## 4. Add them to Vercel
Vercel → your project → **Settings → Environment Variables**. Add all three
(Production + Preview), then **redeploy** (Deployments → ⋯ → Redeploy).

## 5. First boot seeds the demo courses automatically
On the first request after the keys are live, the app checks whether the
`courses` table is empty and, if so, seeds the 8 demo courses + slots so the
site isn't blank. It **only seeds when empty**, so it will never wipe real
signups. (You can also trigger it from the `/admin` "Reset" button.)

## How to confirm it's working
- Sign up a test business in the **Business Corner** (code `5432`).
- Redeploy or wait a minute, reload `/admin` — the pending signup is **still
  there** (with the mock it would have vanished). That's persistence.

## What each piece does
| Env var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Which project to talk to |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only full-access key (secret) |

The app auto-detects these: present → Postgres (persistent); absent → mock
(demo). No code changes needed to switch.
