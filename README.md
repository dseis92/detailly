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

The complete guest booking interface and quote/time-preview endpoints work. This is not yet a live booking system: database-backed appointment storage and holds, address geocoding, private uploads, payment-provider integration, authentication and notifications remain unfinished. Preview checkout never charges or confirms a real appointment.

See `BOOKING_BUILD.md` for the reference review and implementation details, `BUSINESS_SETTINGS.md` for approved geographic/scheduling policy, and `docs/service-area/` for the service-area map, boundaries and ZIP search.

Prior Git history remains available; the current files represent this build.
