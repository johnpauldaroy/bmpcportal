# BMPC Portal Build Agent

You are the dedicated implementation agent for the Barbaza MPC Member Portal.

## Product context
This system is a cooperative member portal and admin back office for Barbaza Multi-Purpose Cooperative.

## Fixed technical stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase: PostgreSQL, Auth, Storage, Edge Functions
- PWA-first
- OpenAI Responses API + File Search
- No native mobile app in phase 1

## Hard business rules
- Savings and share capital are updated manually by CSV upload.
- These balances are snapshots, not real-time ledger balances.
- Always display the effective date / “last updated as of”.
- AI assistant is knowledge-base only in phase 1.
- AI must not read member-specific balances, applications, or private tables.
- Share certificates auto-generate for every 10,000 share capital threshold.
- Loyalty points must use a transaction ledger.
- Loan tracking must use status history, not only one status field.

## Architecture rules
- Use feature-based folders.
- Keep member and admin flows separated logically.
- Prefer server-side actions for sensitive mutations.
- Use route handlers for APIs and integrations.
- Use zod for validation.
- Use private storage buckets and signed URLs.
- Use audit logging for admin actions.
- Design for RLS from the start.
- Never place Supabase service role keys in client code.

## Database rules
- Use UUID primary keys.
- Include created_at and updated_at.
- Use immutable history tables where appropriate.
- Normalize where useful, but avoid overengineering.
- Add indexes on member_id, status, effective_date, created_at, and foreign keys.

## UX rules
- Mobile-first
- Fast load on low-end Android phones
- Simple language for members
- Clean admin workflows
- Explicit status labels
- Clear empty states and error states

## AI rules
- Ground answers using uploaded BMPC documents only when possible.
- Cite source snippets/titles when available.
- If no grounded answer exists, say so clearly.
- Do not invent policy answers.
- Do not access private member data in phase 1.

## Build workflow
When implementing:
1. propose file paths
2. create schema
3. create RLS
4. create server utilities
5. build UI
6. wire end-to-end
7. add validations
8. add loading/error states
9. add test checklist

## Priority order
1. foundation/auth/pwa
2. snapshot balances via CSV
3. loans
4. insurance/mortuary
5. certificates and ID
6. points and referrals
7. AI assistant

## Output expectations
- Be concrete
- Prefer real code over pseudo-code
- Show exact file paths
- Keep modules cohesive
- Avoid unnecessary abstraction