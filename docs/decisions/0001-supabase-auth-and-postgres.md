# Decision 0001: Supabase Auth and PostgreSQL

- **Status:** accepted
- **Date:** 2026-10-03
- **Decision owner:** business owner

## Context

The initial foundation kept managed PostgreSQL and email authentication provider-neutral, with Auth.js as the preliminary recommendation. The owner supplied the existing Supabase project URL and asked to use it for persistent booking data and customer accounts.

## Decision

Use the supplied Supabase project for PostgreSQL and Supabase Auth. Use verified email magic links through `@supabase/ssr`; keep app-level users, customers, memberships, and roles in the existing Drizzle schema. The app server uses a private PostgreSQL connection and enforces business/customer authorization at server boundaries. Enable RLS and revoke Data API privileges for personal and appointment tables. Do not use a Supabase secret/service-role key in the web client.

## Consequences

- Supabase Auth owns passwordless identity and session refresh; the app retains its own role assignments.
- A verified email may view booking requests recorded against that email. Guest records remain separate in the database.
- Production email-link delivery requires custom SMTP and correct allowed redirect URLs.
- Drizzle migrations must be reviewed and explicitly applied. The supplied database has not been migrated because connection credentials have not been configured.
- Booking requests are stored as `request_received`; they do not hold crew capacity or become confirmed until live scheduling and deposit payment are implemented.
- `postgres.js` warns of a pipeline incompatibility with Supabase's shared transaction-mode pooler, so the setup instructions specify the session-mode pooler for this current driver/transaction implementation. Revisit this choice before increasing serverless concurrency.

## Alternatives considered

- **Auth.js with a separate SMTP/database setup:** keeps the first baseline and adds another provider integration, despite the owner's existing Supabase account.
- **Supabase Data API for appointment rows:** simpler client integration, but would require a full RLS policy layer for every operation. This app already has Drizzle domain queries and transaction needs, so private server-side PostgreSQL access is retained.
