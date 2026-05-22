# M01 — Community Network

Profile-based member discovery with AI-powered compatibility matching. Members post offers (skills/resources they provide) and seeks (things they need), and the system surfaces alignment scores based on values, skills, personality, and goals.

## Routes

| Route | File |
|-------|------|
| `/network` | `app/network/page.tsx` → inline (imports `MemberList`) |
| `/network/discover` | `app/network/discover/page.tsx` → `DiscoverClient` |
| `/network/matches` | `app/network/matches/page.tsx` → `MatchesTabs` |
| `/network/offers` | `app/network/offers/page.tsx` → `OffersPage` |
| `/network/seeks` | `app/network/seeks/page.tsx` → `SeeksPage` |
| `/network/profile` | `app/network/profile/page.tsx` → `ProfilePage` |

## Files

| File | Purpose |
|------|---------|
| `MemberList.tsx` | Grid of member cards with match score badges |
| `DiscoverClient.tsx` | Filterable/searchable full member directory |
| `MatchesTabs.tsx` | Tabbed view of Top / Good / Potential matches |
| `NetworkSidebar.tsx` | Left sidebar with nav links and user summary |
| `NetworkRightPanel.tsx` | Right panel (activity, resources) |
| `OffersPage.tsx` | CRUD interface for user's skill/resource offers |
| `SeeksPage.tsx` | CRUD interface for user's help requests |
| `ProfilePage.tsx` | User's own profile view (avatar upload, tabs) |
| `lib/match-score.ts` | **Core matching algorithm** — scores two bios across skills, interests, OCEAN, and MBTI |

## Match scoring

`lib/match-score.ts` exports `computeMatch(myBio, theirBio)` which returns `{ score: number, reasons: string[] }`.

| Dimension | Max points |
|-----------|------------|
| Shared skills | 30 (5 per skill, up to 6) |
| Shared interests | 20 (4 per interest, up to 5) |
| OCEAN similarity | 25 |
| MBTI compatibility | 25 |
| **Total** | **100** |

## Database tables

| Table | Access |
|-------|--------|
| `user_profiles` | Read/write — member cards, profile page |
| `user_bio` | Read/write — match scoring data |
| `user_offers` | Read/write — offers CRUD |
| `user_requests` | Read/write — seeks CRUD |

## How to work on this module

```bash
cd web && npm run dev
# Navigate to http://localhost:3000/network
```

To modify matching logic, edit `lib/match-score.ts`. The function is pure (no DB calls) and easy to unit-test.

To add a new member card field, update `MemberList.tsx` and the relevant Supabase select query in `app/network/page.tsx`.
