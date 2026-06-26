# BMPC Portal Folder Structure

```text
bmpcportal/
  docs/
    architecture/
      folder-structure.md
      implementation-roadmap.md
  public/
    icons/
    sw.js
  src/
    app/
      (auth)/login/
      (member)/member/
      admin/
      api/
        ai/chat/
        health/
        qr/verify/[token]/
      globals.css
      layout.tsx
      manifest.ts
      page.tsx
    components/
      ui/
    config/
    features/
      ai/
      auth/
      balances/
      documents/
      insurance/
      loans/
      loyalty/
      mortuary/
      notifications/
      referrals/
    lib/
      server/
      supabase/
      validators/
    test/
    types/
  supabase/
    migrations/
    seed/
```

## Architecture Choices

- `src/app` owns App Router pages, layouts, route handlers, PWA metadata, and server-rendered entry points.
- `src/features/*` groups domain code by BMPC module so member and admin workflows can evolve independently.
- `src/lib/supabase` separates browser, server, middleware, and service-role clients to avoid leaking privileged keys.
- `src/lib/server` contains cross-cutting server utilities such as audit logging.
- `supabase/migrations` contains SQL schema, indexes, triggers, and RLS policies from the start.
- `docs/architecture` records implementation decisions and phase order so later work stays aligned with the master prompt.
