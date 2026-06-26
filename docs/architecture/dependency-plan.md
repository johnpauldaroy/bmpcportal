# Dependency Plan

## Runtime

- `next`, `react`, `react-dom`: App Router UI and server rendering.
- `@supabase/supabase-js`, `@supabase/ssr`: database, auth, storage, SSR session handling, and service-role operations.
- `openai`: Responses API and File Search integration for the phase 1 knowledge-base assistant.
- `zod`: shared validation for route handlers, forms, CSV rows, and service inputs.
- `react-hook-form`, `@hookform/resolvers`: member/admin forms with typed validation.
- `papaparse`: CSV parsing for client preview and later server-side import validation.
- `qrcode`: digital membership ID and verification QR generation.
- `lucide-react`: consistent icon system.
- `clsx`, `tailwind-merge`: safe Tailwind class composition.
- `date-fns`: date formatting and expiry/reminder calculations.

## Development

- `typescript`: strict type checking.
- `tailwindcss`, `@tailwindcss/postcss`: Tailwind CSS pipeline.
- `eslint`, `eslint-config-next`, `@eslint/eslintrc`: Next.js lint rules.
- `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`: validator, component, and utility tests.
