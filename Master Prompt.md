You are a senior full-stack architect and implementation agent.

Build a production-grade cooperative member portal for Barbaza Multi-Purpose Cooperative using:

- Next.js latest App Router
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- PWA-first responsive design
- OpenAI Responses API with File Search for a knowledge-base-only AI assistant

Important constraints:
- This is PWA only for now, not a native mobile app.
- Member financial data is NOT real-time.
- Savings and share capital are updated manually through CSV upload by admins.
- The portal must always show “Last updated as of [date]”.
- The AI assistant is KNOWLEDGE-BASE ONLY in phase 1 and must not access member-specific balances, loans, or private account data.
- Use secure architecture with Supabase Row Level Security.
- Use feature-based modular architecture.
- Generate maintainable, production-ready code.
- Prefer server-side validation and typed schemas.
- Use zod for validation.
- Use React Hook Form for forms.
- Use a clean admin dashboard and mobile-first member UI.

Build these modules:

1. Authentication and roles
   - member login
   - admin login
   - role-based access
   - profile management

2. Member financial snapshots
   - savings snapshots from CSV upload
   - share capital snapshots from CSV upload
   - display balances by latest imported effective date
   - import preview, validation, and error reporting

3. Loans
   - loan products
   - member loan application form
   - attachment upload
   - admin review workflow
   - status history timeline
   - member tracking page

4. Insurance
   - insurance availment records
   - effective date and expiry date
   - expiring/expired indicators
   - reminders

5. Mortuary
   - mortuary availment records
   - optional claim-ready data structure

6. Notifications
   - in-app notifications first
   - design system ready for push/email/SMS providers later
   - notification preferences
   - event-driven notification creation

7. Documents
   - digital share certificates
   - auto-generate one certificate per 10,000 share capital threshold
   - digital membership ID with QR verification endpoint

8. Loyalty and rewards
   - ledger-based points transactions
   - rewards catalog
   - redemption workflow

9. Referrals
   - referral code system
   - referral tracking
   - reward points on verified referral

10. AI assistant
   - admin upload of knowledge documents
   - vector store sync workflow
   - chat UI
   - answer only from uploaded BMPC knowledge base
   - return citations/snippets where possible
   - refusal/fallback when no grounding exists

Architecture requirements:
- App Router with route handlers
- feature folders for each domain
- repository/service pattern where useful
- clear server/client boundaries
- Supabase SSR auth pattern
- RLS-aware schema design
- signed URLs for private files
- audit logging for admin actions
- idempotent CSV imports
- immutable history tables for statuses and imports

Deliver the work in this order:

Phase A: Project scaffold
- folder structure
- dependency list
- environment variable template
- base layout
- auth setup
- Tailwind and UI system
- PWA manifest and service worker scaffold

Phase B: Database design
- full SQL schema
- enums
- indexes
- foreign keys
- RLS policies
- seed data
- storage bucket strategy

Phase C: Core backend
- Supabase clients
- auth helpers
- route handlers
- zod validators
- import pipeline
- audit log utilities
- notification event utilities

Phase D: Member portal
- dashboard
- balances page
- loans page
- insurance page
- mortuary page
- points page
- referrals page
- digital ID page
- certificates page
- AI assistant page

Phase E: Admin portal
- member management
- CSV import center
- loan management
- insurance management
- mortuary management
- rewards management
- referral management
- knowledge base management

Phase F: AI integration
- OpenAI service wrapper
- vector store document sync job
- chat endpoint
- citation rendering
- guardrails to prevent private data retrieval

Phase G: Hardening
- error states
- loading states
- permission checks
- rate limiting plan
- audit trail
- test plan
- deployment checklist

For every phase:
- explain architecture choices briefly
- generate code incrementally
- include file paths
- do not skip database or RLS
- do not use mock architecture when real code can be written
- prefer complete vertical slices over vague placeholders

Start with:
1. final folder structure
2. dependency plan
3. environment variables
4. SQL schema outline