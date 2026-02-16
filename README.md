# Nascar Race with Friends

This is a clean, deployable Next.js 14 App Router project that avoids the ESM/CommonJS config issues.

## Important notes (Vercel)
- This repo **does not** set `"type": "module"` in package.json.
- PostCSS config is **postcss.config.cjs** (CommonJS), which fixes the error:
  `ReferenceError: module is not defined in ES module scope`.

## Deploy
1) Import to Vercel
2) Add env vars from `.env.example`
3) Deploy

## Supabase tables (recommended)
- picks (player text unique, picks jsonb)
- drivers (driver_name text, qual_pos int, running_pos int, finish_pos int)
- current_state (id int=1, race_name text, picks_lock_utc text, locked bool)
- sync_log (ran_at timestamptz/text) optional
