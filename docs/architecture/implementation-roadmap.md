# BMPC Portal Implementation Roadmap

## Phase A: Project Scaffold

- Next.js App Router, TypeScript, Tailwind CSS, ESLint, Vitest, and PWA files.
- Supabase SSR client helpers for browser, server components, middleware, and service-role operations.
- Feature-based folders for auth, balances, loans, insurance, mortuary, documents, loyalty, referrals, notifications, and AI.
- Environment template with public, server-only, Supabase, OpenAI, import, and rate-limit settings.
- Base member/admin UI shell, auth page, placeholder route groups, health route, QR verification route, and knowledge-base chat route.

## Phase B: Database Design

- Apply `supabase/migrations/0001_initial_schema.sql`.
- Add seed data in `supabase/seed/0001_seed.sql` for loan products, admin bootstrap guidance, reward samples, and notification templates.
- Confirm all member-private tables have RLS policies scoped to `auth.uid()`.
- Confirm admin policies are role-based through `profiles.role`.
- Create private storage buckets for loan attachments, certificates, membership IDs, import files, and knowledge-base documents.

## Phase C: Core Backend

- Replace scaffolded audit and notification utilities with Supabase inserts inside transactions.
- Implement CSV import route handlers for preview, validation, idempotency hashing, commit, and row-level error reporting.
- Add repository/service modules for snapshots, loans, documents, loyalty, referrals, and notification events.
- Add signed URL helpers for private files.

## Phase D: Member Portal

- Wire member dashboard to Supabase data.
- Build latest-balance snapshot cards with mandatory `Last updated as of [date]` display.
- Add loan application form, attachment upload, and status timeline.
- Build insurance, mortuary, points, referral, digital ID, certificate, and AI assistant pages.

## Phase E: Admin Portal

- Member management.
- CSV import center with preview, validation, commit, and audit log.
- Loan review workflow with status transitions and immutable history.
- Insurance, mortuary, rewards, referrals, and notification management.
- Knowledge-base document upload and vector store sync UI.

## Phase F: AI Integration

- Create OpenAI file upload and vector store sync jobs.
- Store document metadata and sync status in Supabase.
- Return answer text plus citations/snippets when available.
- Enforce knowledge-base-only behavior and keep member/private tables outside the AI service boundary.

## Phase G: Hardening

- Add route-level permission checks and role-aware redirects.
- Add rate limiting to admin/API routes.
- Add error, loading, and empty states for every member/admin workflow.
- Add unit tests for validators and service utilities.
- Add integration tests for import and loan status transitions.
- Add deployment checklist for Supabase migrations, storage buckets, environment variables, and Vercel settings.
