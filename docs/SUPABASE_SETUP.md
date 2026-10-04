# Supabase setup for Detailly

The Supabase project selected for this app is `https://kzfxczncurmhfjclerrd.supabase.co`. This repository uses Supabase Auth for verified email-link sign-in and the project's PostgreSQL database through Drizzle for customer and booking-request records.

## Environment settings

Set these as server/application environment variables in Vercel and `.env.local` for local development:

- `NEXT_PUBLIC_SUPABASE_URL`: the project URL above.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key. This key is designed for browser use; do not substitute the secret/service-role key.
- `DATABASE_URL`: PostgreSQL connection URI from the Supabase Connect panel. This app uses Drizzle transactions with `postgres.js`; use the Supabase **session-mode pooler** URI for this driver. Supabase currently documents a query-pipelining incompatibility between `postgres.js` and the shared transaction pooler.
- `APP_BASE_URL`: the production site origin (and `http://localhost:3000` locally).
- `DETAILLY_OWNER_EMAIL`: the email that should receive the initial owner role after email verification.

Keep `DATABASE_URL` private. Add it only as a server-side Vercel environment variable. Never expose a Supabase secret or service-role key as a `NEXT_PUBLIC_` variable.

## Supabase Auth settings

Enable email sign-in and configure a production SMTP provider under Supabase Auth. The built-in mailer is for limited testing and is not intended for customer-volume delivery. Add the production and local callback URLs (`https://your-domain/auth/callback` and `http://localhost:3000/auth/callback`) to the allowed redirect URLs.

## Database migration

Review and apply migrations in order with `pnpm db:migrate` after `DATABASE_URL` is configured. The new forward migrations add booking-request snapshots and indexes, seed the Detailly business record if missing, enable RLS on personal/booking tables, and remove Data API privileges for anonymous/authenticated roles. The application server uses its private PostgreSQL connection and checks the verified Supabase identity plus business role at each protected page/API boundary.

These migrations are additive and keep existing records. If an apply fails, stop and inspect the migration state before retrying. For recovery after partial application, restore the pre-migration database backup or apply a reviewed forward repair; do not drop the new tables after any booking requests have been stored. No migration has been run against the supplied project yet.

## Current behavior and limits

The booking form stores a `request_received` record with the customer contact data, service/address/vehicle snapshots, server-calculated estimate, and deposit amount. A submitted request is not a confirmed/reserved appointment, and no payment is collected. Live address eligibility, conflict-safe slot holds, deposit checkout, private photo uploads, transactional messages, and booking status operations are not part of this slice.
