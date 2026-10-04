# Detailly

Mobile detailing booking preview based on the inspected Fieldd flow, with the approved Detailly service catalog.

## Booking rules

- Mobile service only; Interior, Exterior and Full Detail packages for four vehicle categories.
- Combined 60-mile straight-line service area around ZIPs 54401, 54403, 54474, 54476, 54481, 54482 and 54467.
- Monday–Sunday, 9am–9pm, America/Chicago; one crew.
- Crew occupancy is service duration plus a 45-minute travel/setup buffer. Start times use 15-minute increments.
- Sales tax 5.5%; required deposit 50%; all amounts calculated server-side.

## Run locally

Use Node 24 and pnpm 11, then:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The canonical project folder is `/Users/dylanseis/dev/detailly`. Build with `pnpm build`; check with `pnpm validate`.

## Current capability

The booking interface, quote/time-preview endpoints, Supabase email sign-in, customer portal, owner request list, and request persistence are implemented. Requests are not confirmed appointments: conflict-safe holds, server-side address verification, private uploads, deposit payments, and notifications remain unfinished. No payment is collected.

See `BOOKING_BUILD.md` for the reference review and implementation details, `BUSINESS_SETTINGS.md` for approved geographic/scheduling policy, and `docs/service-area/` for the service-area map, boundaries and ZIP search.

Prior Git history remains available; the current files represent this build.

## Google address search and location

Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` and in Vercel's environment settings, then rebuild. Enable Maps JavaScript API and Places API (New) on that Google Cloud project with billing enabled. Restrict this browser key to those APIs and HTTP referrers for your production domain and local preview. Never use a server key in this variable.

The address screen offers Google autocomplete biased toward central Wisconsin, a selected-address map, and an explicit “Use my location” button. The customer must grant browser location access; their coordinates are sent to Google to find the street address. Denied location, provider errors, and missing configuration retain manual entry. Customers must confirm the detected street number. Autocomplete bias is not a service-area eligibility check; existing server serviceability rules remain separate.

## Supabase accounts and booking requests

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DATABASE_URL`, `APP_BASE_URL`, and `DETAILLY_OWNER_EMAIL` in the local/Vercel environment. The public Supabase publishable key is safe for browser use; never add a Supabase secret/service-role key to the app. Use the Supabase Connect dialog's PostgreSQL connection string appropriate for the runtime and driver. Keep the migration connection private. Configure Supabase Auth email delivery and add `/auth/callback` to allowed redirect URLs.

Apply the reviewed Drizzle migrations before enabling sign-in. Verified email magic links create customer accounts; the configured owner email receives the owner role. The booking form saves request records and quote snapshots; requests are not confirmed appointments and do not reserve a time until payment and live capacity-safe scheduling are implemented. Guest requests become visible in the customer portal after the customer verifies the same email address. Private photo storage, live area verification, deposits, and booking confirmation remain future work.

See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for migration, database connection, email delivery and recovery details.
