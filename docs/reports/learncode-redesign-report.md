# LearnCode redesign & security audit report

**Date:** 25 October 2026  
**Project:** `/home/user/LearnCode`  
**Status:** Implementation and code-level checks complete; browser-flow and live-service verification remain blocked by environment/configuration.

## Executive summary

LearnCode was improved in place; the existing app, authentication, Supabase, Groq-only AI, progress, quiz, certificate, and admin architecture were retained.

- Reworked the AI Tutor into a conversation-first chat with a responsive history drawer/sidebar, prompt suggestions, an auto-sizing composer, stop/retry behavior, safe Markdown/code rendering, conditional scrolling, and conversation history management.
- Kept Groq streaming real. Improved SSE parsing for chunked/CRLF responses and made truncated provider streams surface as errors rather than successful completions.
- Added owner-scoped conversation list/search/detail/rename/delete endpoints. Search covers conversation titles and message content; user search text is sent in a POST body rather than the URL. Server identity and ownership come from the verified Supabase session.
- Added Google OAuth sign-in/sign-up on the login and registration screens. It uses Supabase PKCE, the existing safe callback, and checks suspension after login; credentials remain owner-configured in Supabase.
- Added optional YouTube lesson metadata with client/server validation, a migration, admin preview/removal, and a lazy privacy-enhanced embed constructed from a validated video ID. It does not autoplay or affect completion.
- Simplified landing, dashboard, course-detail, admin lesson-list, and admin navigation content without introducing invented metrics or testimonials.
- Updated the Node engine declaration to 22+, matching the installed Supabase packages, and addressed the dependency audit findings.

## Validation

| Check | Result |
|---|---|
| `npm run typecheck` | Passed under Node 22.23.4 |
| `npm run lint` | Passed, no ESLint warnings |
| `npm test` | **122 passed** across 13 test files |
| `npm run build` | Passed under Node 22.23.4; Next.js compiled and listed application routes |
| Dependency audit | `npm ci` reported **0 vulnerabilities** after dependency updates |
| Playwright public/auth flows | **Not validated in a browser.** 2 API tests passed; the 17 browser tests could not launch Chromium because the sandbox lacks system libraries (`libnspr4`, `libnss3`, ATK, and others). Installing the browser binary alone did not provide these OS dependencies. No page assertions ran for those 17 tests. |
| Live Supabase/Groq | Not verified. The build logged `[platform] settings lookup failed TypeError: fetch failed`; no claim is made that a live database or Groq request succeeded. |

Vitest also prints a non-failing Vite config-loader warning for `vitest.config.ts` using ESM syntax while loaded as CommonJS.

## Implementation notes

### AI Tutor

- Desktop sidebar and mobile history drawer; conversation loading, title/message search, rename, confirmed deletion, and new chat.
- Auto-sizing textarea; Enter sends and Shift+Enter inserts a newline; send/stop/retry; draft is restored on failed requests.
- Retryable errors are distinguished from quota/configuration errors. Unsaved new conversations are discarded where possible, and persistence failures are reported to the learner.
- Markdown links are restricted to safe schemes, external links use `noopener noreferrer`, raw HTML is not rendered, remote images are suppressed, and code blocks have copy controls.
- Auto-scroll follows new output only while already at the bottom; a latest-message control appears when the learner scrolls away. Reduced-motion preferences are respected.
- Lesson context is optional in the standalone Tutor and attached from the active lesson workspace; selected code can be handed off to the Tutor.
- Stream parsing is exercised by mocked unit tests, including CRLF split across chunks and truncated streams. No simulated typing or fake provider responses were added.

### Google OAuth

- Added Google sign-in buttons to login and registration; the browser uses the Supabase public client only.
- The callback URL is built from the canonical `NEXT_PUBLIC_APP_URL`, the redirect target is restricted to safe same-origin paths, and the existing PKCE callback exchanges the code server-side.
- The callback signs out suspended accounts after OAuth. First-time Google accounts use the existing database profile trigger and receive the default learner role; no admin role is granted.
- Google OAuth credentials/provider activation were not configured or tested here. The README gives owner-side Google Cloud and Supabase setup steps; the Google client secret belongs in Supabase only.

### YouTube lessons

- Recognized YouTube URL forms are parsed server-side and client-side; only the validated 11-character video ID and optional title/description are persisted. Raw iframe markup and look-alike hosts are rejected.
- Embeds use `youtube-nocookie.com`, lazy loading, a responsive 16:9 frame, a descriptive title, and a YouTube fallback link; there is no autoplay.
- The connected Supabase database already had the LearnCode tables, row-level security, admin read-model functions, and seeded course content. The `add_lesson_youtube_video` migration was applied successfully; the three nullable metadata columns and four validation constraints were verified afterward.

### Dependency/runtime safety

- Updated Vitest to 4.1.12 and pinned Monaco’s DOMPurify dependency to 3.4.17, resolving the audit findings seen after the initial install.
- Declared Node.js `>=22.0.0` to align with `@supabase/*` package engines. Final typecheck, lint, tests, and build were run with Node 22.23.4 via `npm exec`.

## Remaining verification

1. Run the Playwright suite in an environment with Chromium OS dependencies installed, including mobile viewport checks and the admin guard suite.
2. Apply `supabase/migrations/20260103000000_lesson_youtube_video.sql` to the target project and verify create/edit/remove/render against that database.
3. Configure the Google OAuth client in Google Cloud and Supabase, add the production app callback to Supabase’s redirect allow-list, then test sign-in with a real Google account.
4. With owner-provided Supabase and Groq configuration, exercise authenticated conversation persistence, ownership isolation, streaming cancellation, and lesson-context handoff end-to-end.

## Files changed or created for this redesign

### Tutor, streaming, and conversation history

- `src/app/(app)/ai-tutor/page.tsx`
- `src/app/api/ai/conversations/route.ts`
- `src/app/api/ai/conversations/[id]/route.ts`
- `src/components/ai/tutor-chat.tsx`
- `src/components/ai/tutor-chat-types.ts`
- `src/components/ai/tutor-composer.tsx`
- `src/components/ai/tutor-conversation-sidebar.tsx`
- `src/components/ai/tutor-message-list.tsx`
- `src/components/ai/tutor-mode-toolbar.tsx`
- `src/components/learning/tutor-drawer.tsx`
- `src/components/learning/lesson-workspace-view.tsx`
- `src/components/ui/dialog.tsx`
- `src/lib/ai/groq.ts`
- `src/lib/ai/service.ts`
- `src/lib/rate-limit.ts`
- `tests/unit/groq-stream.test.ts`

### YouTube lessons and admin UX

- `src/app/(admin)/admin/lessons/[id]/page.tsx`
- `src/app/(admin)/admin/lessons/page.tsx`
- `src/components/admin/admin-nav.tsx`
- `src/components/admin/lesson-form.tsx`
- `src/components/learning/youtube-video.tsx`
- `src/lib/actions/admin-lessons.ts`
- `src/lib/admin/queries.ts`
- `src/lib/data/learning.ts`
- `src/lib/validation/admin.ts`
- `src/lib/youtube.ts`
- `supabase/migrations/20260103000000_lesson_youtube_video.sql`
- `tests/unit/admin-youtube-validation.test.ts`
- `tests/unit/youtube.test.ts`

### Google OAuth

- `src/app/(auth)/login/login-form.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/register-form.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/components/auth/google-sign-in-button.tsx`
- `src/lib/actions/auth.ts`
- `src/lib/auth-redirect.ts`
- `tests/unit/auth-redirect.test.ts`
- `e2e/public.spec.ts` (registration copy assertion)

### Public/dashboard content, runtime, and docs

- `src/app/(marketing)/page.tsx`
- `src/app/(marketing)/courses/[slug]/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `README.md`
- `package.json`
- `package-lock.json`
- `docs/reports/learncode-redesign-report.md` (this report)

The earlier OTP setup report remains at `docs/reports/resend-supabase-otp-report.md` and is separate from this redesign report.

---

## Addendum: Blog, SEO, CMS, and MasterCode promotion

This addendum records the additional LearnCode work in the current checkout without replacing the original redesign findings.

### Delivered

- Added public `/blog`, `/blog/[slug]`, and `/blog/category/[slug]` routes with responsive article reading layouts, breadcrumbs, accessible contents lists for longer posts, relevant internal course/lesson links, related articles, and share links.
- Added route-specific Next.js metadata, the production canonical origin `https://learncode.web.id`, Open Graph/Twitter data, and JSON-LD derived from actual public content. Added `public/robots.txt` and a dynamic `/sitemap.xml`; public server queries and RLS exclude drafts and future-dated posts.
- Added the `/admin/blog` CMS for creation, editing, preview, draft/publish/unpublish/archive/delete, slug/category/author/cover/excerpt/SEO/date controls. Each Server Action independently checks the existing admin session, validates references and fields, rate-limits, writes through the server-only service-role client, records an audit event, and revalidates public surfaces.
- Added `blog_categories` and `blog_posts` schema, indexes, constraints, update triggers, RLS, and read-only anon/authenticated grants. Direct table writes through browser roles remain denied. Covers use HTTPS URLs plus required alt text; no Storage bucket is used.
- Added five categories and ten substantive Indonesian starter articles, attributed to the LearnCode publisher fallback. The generated course seed now resolves optional starter-post course references if the CLI migration order creates blog rows before course rows.
- Added the MasterCode dialog as an in-memory per-document promotion, with keyboard dismissal/focus handling, reduced-motion styles, no dismissal persistence, and route exclusions for admin, authentication, and verification flows.

### Verification

| Check | Latest result |
|---|---|
| `npm run typecheck` (Node 22.23.4) | Passed |
| `npm run lint` | Passed |
| `npm test` | **144 passed** across 16 files |
| `npm run build` | Passed; blog, admin CMS, and sitemap routes were listed |
| Supabase schema/content verification | Blog schema and starter content are present on project `nahkmynkospzvdihnvck`; remote migration records are `20261109103258` and `20261109103537`. RLS is enabled, five categories and ten currently public articles were confirmed, and each article has valid category/course references. |
| Local preview smoke test | Dev server started on port 3000; `/`, `/blog`, `/sitemap.xml`, and `/robots.txt` returned HTTP 200. Blog reads log a fetch failure and show the empty state because `.env.local` points to unavailable local Supabase; remote posts are not served in this preview. |
| Local PostgreSQL/RLS script | Not executed: neither local Supabase (`127.0.0.1:54321`) nor `psql` is available in this workspace. `supabase/tests/rls_test.sql` and the README run order were updated, but a local DB assertion run is still pending. |
| Browser end-to-end | Not executed: Chromium is unavailable because the sandbox lacks required OS libraries, as described in the original report. |
| Vercel / public deployment | The Vercel `learncode` project has an existing READY/PROMOTED production deployment for `learncode.web.id`, sourced from GitHub `LearnCode-v2` `main` at commit `3d83cb8` (registration-verification test change). This is not the checkout updated here: the workspace is not a Git repository, so these blog/popup/SEO changes were not deployed. The local `.env.local` points to unavailable local Supabase, so the local preview cannot display remote posts without suitable local configuration. |

The build also emitted a nonfatal `[platform] settings lookup failed TypeError: fetch failed` because the local Supabase endpoint is unavailable, plus the existing Vite config-loader warning. The current dependency install reported eight moderate npm audit findings; they were not addressed with broad/force upgrades as part of this work.

### Migration-history note

The blog migrations have been applied and verified on the connected project, but remote versions (`20261109103258`, `20261109103537`) do not match this checkout’s local filenames (`20261017000000`, `20261017000100`). The pre-existing migrations also have historical version differences. Do not run `supabase db push` against that existing project until its local/remote migration histories are reconciled. No further production database action is required for this checkout.

### Principal files

- Public blog: `src/app/(marketing)/blog/`
- Admin CMS: `src/app/(admin)/admin/blog/`, `src/components/admin/blog-post-form.tsx`, `src/lib/actions/admin-blog.ts`
- Blog data/validation/Markdown: `src/lib/data/blog.ts`, `src/lib/admin/blog.ts`, `src/lib/validation/blog.ts`, `src/lib/markdown.ts`
- SEO/crawling: `src/lib/seo.ts`, `src/components/seo/json-ld.tsx`, `src/app/sitemap.ts`, `public/robots.txt`
- Popup: `src/components/marketing/mastercode-popup.tsx`, `src/lib/mastercode-popup.ts`
- Supabase blog migrations: `supabase/migrations/20261017000000_blog_schema.sql`, `supabase/migrations/20261017000100_blog_initial_articles.sql`
- Course seed link resolver: `scripts/generate-seed.ts`, `supabase/seed.sql`
- Database access checks: `supabase/tests/rls_test.sql`
