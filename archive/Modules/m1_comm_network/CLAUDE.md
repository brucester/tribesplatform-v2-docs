@AGENTS.md

# Module 01 — Community Network

Part of **TribesPlatform v2** (also called MyCoNet / Regen Tribe).

**Working directory:** `tribesplatform-v2/Modules/m1_comm_network`
**Live URL:** https://regen-platform.vercel.app
**Supabase project ref:** `vzgoulsqmhvhbjhzlzkf` (West EU — Ireland)

## Stack
Next.js (App Router) · Supabase Auth + PostgreSQL + Storage · TypeScript · Vercel

## Key conventions
- Server components fetch data; client components handle interactivity (`'use client'`)
- Supabase server client (`lib/supabase/server.ts`) for server components
- Supabase browser client (`lib/supabase/client.ts`) for client components
- CSS design tokens in `globals.css` — use vars, not hardcoded colours
- Dark mode via `data-theme` attribute on `<html>`; localStorage key `'theme'`

## Database tables
`user_profiles` · `user_bio` · `user_offers` · `user_requests` · `user_travel_plans` · `user_community_prefs` · `user_connections`

Schema files: `supabase/schema.sql` (base) · `supabase/bio-schema.sql` (user_bio)

## Active pending items
- Cloudflare DNS for `regentribe.co` → Resend DKIM + SPF → update Supabase sender to `hello@regentribe.co`
- Phase C: Matches page (ranked top matches + score breakdown)
- Phase D: Connections (send/accept requests from profiles)
