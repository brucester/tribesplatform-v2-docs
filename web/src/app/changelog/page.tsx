import Link from 'next/link'

const ENTRIES = [
  {
    version: 'v3.10',
    date: '2026-05-21',
    title: 'Match scoring, AppTopBar dropdown, Home access tiers, Governance 4-layer demo',
    items: [
      'New match scoring engine (lib/match-score.ts) — scores two member bios across shared skills (up to 30 pts), shared interests (up to 20 pts), OCEAN personality similarity (up to 25 pts), and MBTI compatibility (up to 25 pts). Max score 100.',
      'Network dashboard shows a "Your Matches" section with top 4 ranked matches, with score badge and reasons. MemberList cards and tiles show a match % badge when a score is available.',
      'Public profile pages show a match score pill (score + reason) when viewing another member.',
      'AppTopBar avatar pill now opens a hover/click dropdown: View profile, Edit profile, Dashboard, Network, Contributions, Governance, theme toggle (light/dark), and Sign out.',
      'Home portal /home — new access tiers strip showing Browse → Create Account → Join → Resident with "YOU ARE HERE" highlight based on actual role.',
      'Joining reward banner on /home shown to joining+ roles with Community Joiner badge callout.',
      'Governance demo on /home upgraded to full 4-layer panel (Consent, Democracy, Meritocracy, AI Facilitation) with live progress bar and LIVE/Evaluating status.',
      'GovernanceClient now uses evalLayers() against real votes, with StatusPill component and role-gated "New proposal" button.',
      'Version tag in top bar now links to this changelog page.',
    ],
  },
  {
    version: 'v3.01',
    date: '2026-05-21',
    title: 'AppShell, M08 Contributions, M09 Governance, /home portal',
    items: [
      'New AppShell.tsx wraps all non-auth pages with AppTopBar + AppSideNav + ProfileCompletionProvider.',
      'Profile completion bar — 22px strip under nav showing % complete across 11 fields. Disappears at 100%.',
      'M08 Contributions page — achievement catalog with unlocked/locked states. Profile Pioneer badge awarded automatically at 100% profile completion.',
      'M09 Governance page — full proposal list with 4 decision-mode filters, vote breakdown bars, comment threads, and new proposal modal.',
      'New /home portal explainer — live data from all modules. Member cards, Blueprint phases, values checkboxes, project proposals, deliverables feed.',
      'New tables: user_achievements (with RLS), proposals, proposal_votes, proposal_comments.',
    ],
  },
  {
    version: 'v3.09',
    date: '2026-05-14',
    title: 'Conflict-aware AI review panel',
    items: [
      'When the AI suggests an answer for a field that already has content, both values are now shown side by side — you choose which to keep.',
      'Conflict fields default to "Keep current" instead of silently overwriting your existing answers.',
      'Each conflict card shows a status badge (Keep current / Use new answer) while collapsed; click to expand and compare.',
      'Non-conflict fields (AI-only answers) retain the same accept/reject toggle behavior.',
    ],
  },
  {
    version: 'v3.08',
    date: '2026-05-14',
    title: 'PDF upload support + admin role fixes',
    items: [
      'Blueprint file upload now supports PDF files (including 100 MB+). PDF.js extracts text page-by-page in the browser with a live progress bar before scanning begins.',
      'Chunk size increased from 5,000 → 15,000 characters. Large documents now need far fewer API calls to scan fully.',
      'Documents larger than 450,000 characters (30 chunks) show a truncation notice in the review panel so you know if content was cut.',
      'File dropzone now accepts .PDF alongside .txt, .md, and .json.',
      'Oscar admin role restored (had been reset to joining). Role enforcement is now consistent.',
    ],
  },
  {
    version: 'v3.05',
    date: '2026-05-14',
    title: 'Dashboard polish — color order, module layout, M02/M03',
    items: [
      'All 14 modules now follow a rainbow color order: M00 Black → M01 Brown → M02 Red → M03 Orange → M04 Yellow → M05 Green → M06 Blue → M07 Indigo → M08 Violet → M09 Pink → M10 White → M11 Silver → M12 Gold. Every card, badge, and page accent updated to match.',
      'Dashboard active modules grid now ordered numerically (M01 → M04 → M05 → M06 → M07).',
      'M02 Neighborhood Directory and M03 Resources & Tools moved to the coming-soon section — they link out to the v1 tribesplatform.app site with a "v1 available ↗" badge until v2 is built.',
      'Logo in the Nav now routes logged-in users to /dashboard and logged-out users to the landing page.',
    ],
  },
  {
    version: 'v3.04',
    date: '2026-05-14',
    title: 'M06 Agreements + M07 Operations',
    items: [
      'New /ops page — M07 Operations — lists all community projects. Admin can create projects, toggle "open for collaborators," post timeline updates, and accept/decline/progress collaboration proposals inline.',
      'New /agreements page — M06 Agreements — joining+ members browse projects open for collaboration and submit proposals specifying what they will do and what they expect in return. Status tracks through pending → accepted → active → completed.',
      'New projects, project_updates, and collaboration_agreements tables with RLS policies. Admin can update any agreement; users can only update their own pending proposals.',
      'Dashboard M06 and M07 cards show live counts (active projects, submitted proposals).',
      'Explorer-gated: M06 Agreements shows a "Complete M05 Join first" notice until the user has submitted their join application.',
    ],
  },
  {
    version: 'v3.03',
    date: '2026-05-14',
    title: 'Admin roles + dashboard home behavior',
    items: [
      'oscar and sonia accounts promoted to admin role — full access to Blueprint editing, project management, and agreement review.',
      'Logo tap/click routes logged-in users to /dashboard (their home screen) instead of the public landing page.',
      'M02 Neighborhood Directory and M03 Resources & Tools added to dashboard with external links to the v1 tribesplatform.app site.',
      'Dashboard modules reordered numerically (M01 → M02 → M03 → M04 → M05 → M06 → M07).',
    ],
  },
  {
    version: 'v3.02',
    date: '2026-05-14',
    title: 'M00 Dashboard + M05 Join module',
    items: [
      'New /dashboard page — M00 MyCoNet Dashboard — personal heads-up display for every member showing Blueprint progress, Network profile completeness, application status, and role-gated coming-soon panels for M05–M09.',
      'Role system added to user_profiles table (explorer / joining / resident / circle_lead / project_lead / admin) — defaults to explorer on signup.',
      'New /join page — M05 Join — application form that reads questions from the Blueprint wizard step 1.4. Logged-out visitors see the questions as a preview. Logged-in users submit answers stored in a new applications table.',
      'Blueprint wizard step 1.4 (First Agreements) now includes a "Join application questions" field — admin writes one question per line, these appear in the M05 Join form.',
      'Login and signup now redirect to /dashboard instead of /network.',
      'Dashboard link added to Nav for logged-in users.',
      'M00 and M05 marked Live in the module grid.',
    ],
  },
  {
    version: 'v2.16',
    date: '2026-05-13',
    title: 'MiniMax 524 retry + concurrency reduction',
    items: [
      'API route now auto-retries on MiniMax 524 gateway timeouts (waits 3s before retry) instead of immediately failing.',
      'Reduced parallel chunk concurrency from 4 → 2 to reduce simultaneous load on MiniMax and lower chance of triggering timeouts on large documents.',
      'Clearer user-facing error message when MiniMax times out after retry.',
    ],
  },
  {
    version: 'v2.15',
    date: '2026-05-13',
    title: 'Landing page button colors + hover states',
    items: [
      'Fixed "Create your profile" and module Live badges using wrong CSS variable (--accent, a pale gray-green) — now correctly use --accent-color (dark green).',
      'Added hover states to all landing page hero buttons and module cards (lift + shadow on hover).',
      'Strengthened shadcn Button hover overlay from near-invisible (3% black) to 7% with smooth 150ms transition and cursor-pointer.',
    ],
  },
  {
    version: 'v2.14',
    date: '2026-05-13',
    title: 'Forgot password flow',
    items: [
      'Added "Forgot password?" link on login form — sends a Supabase password reset email.',
      'New /auth/reset-password page: exchanges the reset code, then lets the user set a new password.',
      'Login page refactored to a three-mode state machine (login / register / forgot).',
    ],
  },
  {
    version: 'v2.13',
    date: '2026-05-13',
    title: 'Schema overhaul — MycoNet v1.0 parity',
    items: [
      'Rebuilt entire user schema to match MycoNet v1.0: personality_details and archetypes as jsonb, places_traveling in user_bio, user_types as text[].',
      'Rewrote profile wizard as an 8-step flow matching v1 exactly (TagInput, OCEAN sliders, zodiac/Human Design, offers/seeks/travel CRUD).',
      'Updated Discover, Matches, Offers, Seeks, Profile, and Dashboard pages to use new field names.',
      'Signup now collects first_name instead of display_name; handle_new_user trigger updated accordingly.',
      'Added Radix UI Slider component for OCEAN personality sliders.',
      'Added "Exploring" as a user type option across wizard and Discover filters.',
    ],
  },
  {
    version: 'v2.12',
    date: '2026-05-13',
    title: 'Light mode font contrast fix',
    items: [
      'Darkened --muted-foreground in light mode from 40% to 28% lightness for better readability.',
    ],
  },
  {
    version: 'v2.11',
    date: '2026-05-12',
    title: 'AI document scanning — working',
    items: [
      'Reduced chunk size from 15,000 → 5,000 chars per MiniMax call. Smaller chunks complete faster and stay within MiniMax\'s timeout window.',
      'Set max_completion_tokens to 8,192 — enough room for MiniMax M2.7\'s chain-of-thought reasoning plus the full JSON output.',
      'Deployed changelog page and home navigation on the Framework Wizard.',
    ],
  },
  {
    version: 'v2.10',
    date: '2026-05-12',
    title: 'Token budget increase',
    items: [
      'Raised max_completion_tokens to 16,384 to give MiniMax M2.7 more room for reasoning and JSON output.',
      'This caused MiniMax 524 gateway timeouts — reverted in v2.11.',
    ],
  },
  {
    version: 'v2.09',
    date: '2026-05-12',
    title: 'Debug logging + deployment diagnostics',
    items: [
      'Added server-side console.log statements in /api/claude to capture raw MiniMax response content in Cloudflare Worker logs.',
      'Confirmed the simple JSON extraction path works correctly for short prompts.',
    ],
  },
  {
    version: 'v2.08',
    date: '2026-05-12',
    title: 'Cloudflare Workers deployment',
    items: [
      'Migrated the entire Next.js app from Vercel to Cloudflare Workers using @opennextjs/cloudflare. Vercel Hobby caps function execution at 60s wall-clock; Cloudflare Workers only count CPU time, so waiting on MiniMax (60–120s) no longer causes timeouts.',
      'Removed export const runtime = "edge" from /api/claude — it conflicted with the OpenNext bundler and caused 500 errors.',
      'Added extractJSON() on the server to strip MiniMax M2.7\'s <think>…</think> reasoning blocks before parsing JSON.',
      'Set friendly error message: "We\'re working on our scanning process, thanks for the patience. Try again later please."',
    ],
  },
  {
    version: 'v2.07',
    date: '2026-05-12',
    title: 'Parallel chunk scanning + prompt tuning',
    items: [
      'Replaced sequential chunk scanning with parallel batches (CONCURRENCY=4).',
      'Increased max_completion_tokens from 1,500 → 4,096 to stop MiniMax from truncating output mid-reasoning.',
      'Removed system message — adding one made M2.7 reason much longer, using up the token budget before the JSON output.',
      'Matched prompt structure to the original working app.',
    ],
  },
  {
    version: 'v2.06',
    date: '2026-05-12',
    title: 'Version label on upload button',
    items: [
      'Added version number below the "Upload a document to start" button on the Blueprint welcome screen so each deploy is easy to verify.',
    ],
  },
  {
    version: 'v2.05',
    date: '2026-05-12',
    title: 'Initial MyCoNet v2 foundation',
    items: [
      'Next.js 16 app with Supabase auth, user profiles, and Cloudflare Workers target.',
      'Blueprint Wizard: full Regenerative Neighborhood Framework (SPARK → PROVE → BUILD → LIVE) with step navigation, radar chart, spiral timeline, and gate checks.',
      'Community Network: profile matching with AI-scored compatibility across values, skills, personality, and MBTI.',
      'MiniMax M2.7 integration for document scanning into wizard fields.',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '56px 24px 80px' }}>
      <div style={{ marginBottom: 48 }}>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'var(--accent)', background: 'var(--accent-soft)',
          padding: '3px 10px', borderRadius: 20, marginBottom: 16,
        }}>
          Release notes
        </div>
        <h1 style={{
          fontFamily: 'var(--display)', fontSize: 40, lineHeight: 1.1,
          letterSpacing: '-0.02em', marginBottom: 12,
        }}>
          Changelog
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.6 }}>
          A running log of what's been built and fixed on the MyCoNet.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {ENTRIES.map((entry, i) => (
          <div key={entry.version} style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr',
            gap: '0 28px',
            paddingBottom: 40,
          }}>
            {/* Left column — version + date */}
            <div style={{ paddingTop: 3 }}>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                color: 'var(--accent)', letterSpacing: '0.04em',
              }}>
                {entry.version}
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-4)',
                marginTop: 4, letterSpacing: '0.02em',
              }}>
                {entry.date}
              </div>
            </div>

            {/* Right column — content */}
            <div style={{
              borderLeft: '1px solid var(--rule)',
              paddingLeft: 28,
              position: 'relative',
            }}>
              {/* Timeline dot */}
              <div style={{
                position: 'absolute', left: -5, top: 6,
                width: 9, height: 9, borderRadius: '50%',
                background: i === 0 ? 'var(--accent)' : 'var(--rule)',
                border: '1.5px solid var(--surface)',
                boxShadow: `0 0 0 1.5px ${i === 0 ? 'var(--accent)' : 'var(--rule)'}`,
              }} />

              <div style={{
                fontFamily: 'var(--display)', fontSize: 20, marginBottom: 12,
                color: 'var(--ink)',
              }}>
                {entry.title}
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {entry.items.map((item, j) => (
                  <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--ink-4)', flexShrink: 0, marginTop: 2, fontSize: 12 }}>—</span>
                    <span style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.65 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        borderTop: '1px solid var(--rule)', paddingTop: 32, marginTop: 8,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link href="/" style={{
          fontSize: 13, color: 'var(--ink-3)', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Back to home
        </Link>
        <span style={{ color: 'var(--rule)', fontSize: 12 }}>|</span>
        <Link href="/blueprint" style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>
          Open Blueprint Wizard
        </Link>
      </div>
    </div>
  )
}
