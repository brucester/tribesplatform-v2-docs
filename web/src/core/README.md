# Core

Shared infrastructure used by every module. Contributors building a module should import from here but rarely need to edit it.

## Structure

```
core/
├── components/
│   ├── shell/          App layout: top bar, side nav, shell wrapper
│   ├── ui/             shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── ModuleHeader.tsx  Colored module banner with number + description
│   ├── Nav.tsx           Legacy nav bar (used on landing page)
│   └── ThemeToggle.tsx   Light/dark mode switch
├── contexts/
│   └── ProfileCompletion.tsx  React context for the profile completion bar
├── lib/
│   ├── supabase/
│   │   ├── client.ts   Browser Supabase client (use in 'use client' files)
│   │   └── server.ts   Server Supabase client (use in Server Components / route handlers)
│   ├── modules.ts      Module registry — the canonical list of all M00–M13 modules
│   ├── module-meta.ts  Display metadata (bg color, label, desc) for each module number
│   └── utils.ts        Tailwind class merge helper (cn)
└── types/
    └── database.ts     TypeScript types generated from the Supabase schema
```

## Import alias

Everything under `core/` is available via `@/core/`:

```ts
import { createClient } from '@/core/lib/supabase/server'
import { Button } from '@/core/components/ui/button'
import type { Database } from '@/core/types/database'
```

## Supabase clients

| File | When to use |
|------|-------------|
| `core/lib/supabase/server.ts` | Server Components, route handlers (`async` functions without `'use client'`) |
| `core/lib/supabase/client.ts` | Client Components (`'use client'` files, `useEffect`, event handlers) |

## Adding to core

Only add things here if they are genuinely shared across 3+ modules. Module-specific helpers belong in the module's own `lib/` folder.
