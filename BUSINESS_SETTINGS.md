# Approved booking settings — October 2, 2026

- Anchor ZIP codes: 54401, 54403, 54474, 54476, 54481, 54482, 54467.
- Area: union of seven 60-mile straight-line circles around the U.S. Census Bureau 2026 ZIP Code Tabulation Area representative coordinates. A point is eligible if it falls within any circle.
- Hours: Monday through Sunday, 09:00–21:00, America/Chicago.
- Crew count: one; scheduling capacity one.
- Time intervals: 15-minute start-time intervals to allow the next job exactly 45 minutes after service completion. All displayed jobs must finish by 21:00; past start times excluded.

Source: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html and its linked 2026 ZCTA national download. Radius distance uses 1 mile = 1609.344 meters and a spherical Haversine calculation.

The ZIP search output contains 187 ZCTA reference points within the combined radius. It is an approximate geographic search result, not a whole-ZIP allowlist. Boundary eligibility must use geocoded customer street coordinates. The map is exported as seven overlapping circles; their union defines coverage.

Implemented `src/modules/business-config/booking-policy.ts`, coordinates with provenance, coordinate-based serviceability evaluator, and a server-controlled `/api/booking/times` preview endpoint. Main booking calendar uses that endpoint instead of sample time choices. Client duration, hours, and capacity do not override server policy. Existing availability preview also uses these operating windows.

Still required before live booking: server-side address verification, database-backed conflict-safe holds and appointment confirmation, payments, and payment setup. Booking requests can be stored, but they do not reserve crew capacity. The owner approved a fixed 45-minute post-service travel/setup buffer; no driving-distance limit was invented. The existing generic availability search route remains a separate preview utility; it is not a reservation endpoint.

Validation: strict typecheck, unit tests, formatting and production build run after the change; results are recorded in the chat. Database-backed double-booking prevention remains unverified because the preview has no configured booking database.

Final results: production build and strict TypeScript passed; 41 tests passed; formatting passed; lint returned zero errors and the existing local-photo warning. Interactive browser verification showed Sunday October 4 four-hour service start times from 9am through 5pm, with the final job ending at 9pm.

## Approved post-service buffer

Every appointment reserves the crew for catalog service duration plus 45 minutes. Example: a sedan interior booked at 9am has service ending at 11am and crew occupancy ending at 11:45am; 11:45am is the next eligible start. Service duration and pricing are unchanged. The API returns `endsAt` for service completion and `blockedUntil` for crew occupancy. Hold/appointment persistence must reserve through `blockedUntil`, and occupied intervals passed to the slot engine must already include the buffer. Service may finish at 9pm with its crew buffer extending afterward, since the owner specified service working hours rather than a cutoff for travel.

Validation after buffer implementation: 45 tests passed and production build/typecheck passed. Tests verify the exact 11:45 boundary, buffer conflicts with later jobs and end-of-day handling. Live booking storage is still pending.
