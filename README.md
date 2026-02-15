# NASCAR Friends League (2026)

Public link for viewing standings + results.
Picks submission requires a single group passcode.

## 1) Create Supabase project
- Create a new project at Supabase.
- In the SQL editor, run: `supabase/schema.sql`.

## 2) Configure environment variables
Copy `.env.example` to `.env.local` and fill:
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- LEAGUE_PASSCODE_BCRYPT (bcrypt hash)
- CRON_SECRET (random string)

Generate passcode hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSCODE',10))"
```

## 3) Seed the current race
In Supabase SQL editor, insert a current race.
Example (edit times + race id):
```sql
update races set is_current = false where is_current = true;

insert into races (season, series, race_id_external, name, start_time_utc, picks_lock_utc, status, is_current)
values (
  2026,
  'cup',
  5273,
  'Daytona 500',
  '2026-02-15T20:00:00Z',
  '2026-02-15T19:45:00Z',
  'scheduled',
  true
);
```

## 4) Run locally
```bash
npm install
npm run dev
```

## 5) Deploy (real site)
### Vercel (recommended)
- Push this folder to GitHub
- Import the repo in Vercel
- Add the same env vars in Vercel Project Settings
- Vercel Cron will hit `/api/cron/sync` every minute (see vercel.json)

For the cron call, set a header:
- Vercel cron cannot add custom headers automatically.
Recommended approach:
- Use a GitHub Action, or
- Set up Vercel Cron to call a *public* cron endpoint that validates a query param:
  e.g. /api/cron/sync?secret=...

If you want pure Vercel Cron, change the route to accept `?secret=`.

## Data source
This project uses the commonly-referenced NASCAR live feed JSON endpoint:
`https://cf.nascar.com/live/feeds/series_1/{raceId}/live_feed.json`
It typically updates every ~15–30 seconds during races.

If NASCAR changes the JSON shape, update the mapper in:
`src/app/api/cron/sync/route.ts`

## What you can customize next
- Add a “Choose Race” admin page
- Auto-detect weekly race id via NASCAR schedule feeds
- Show per-race breakdown like your spreadsheet
