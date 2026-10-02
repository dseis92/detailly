# Detailly booking build

The customer booking interface is implemented and locally runnable. It is a preview, not a production booking system. The original `/Users/dylanseis/dev/detailly` checkout had all tracked source files deleted; those deletions were preserved. This separate build starts from that repository's HEAD and preserves its stack and lockfile.

## Inspected reference

Inspected https://onthegodetailingllc.fieldd.co/ interactively on October 2, 2026, through Add Card, without paying or submitting BOOK NOW.

1. Address-first map with heading, autocomplete, clear control, menu and logo.
2. We Come To You: mobile and shop cards; selecting exposes bottom Next toolbar.
3. Detailing Service: two-column vehicle cards; nested interior/exterior/full detail packages, ceramic and paint services; breadcrumbs.
4. Package detail: image, inclusions, Show More, price/duration, quantity, grouped optional extras, bottom Add button.
5. Date/time: service summary, Monday-first month calendar, month arrows, Earliest action, time buttons, fixed selected-date/Next toolbar.
6. Add Vehicle modal: required Vehicle Make & Model, Save.
7. Additional Information: vehicle selection, condition notes, photo, water and electricity questions.
8. Provide Your Info: email, first/last names, phone, mailing address, referral; guest or account continuation.
9. Confirmation: location, date/time and vehicle, services, customer, notes, itemized totals, coupon, required prepayment, Add Card, BOOK NOW.
10. Add Card: provider-hosted card number, expiry, security code and postal code, Save. No payment details entered.

The reference's receipt/confirmation after payment could not be reviewed without creating a real transaction. No claim of identical unseen screens is made.

## Implemented

Matches the observed white mobile booking surface, red accent, rounded two-column cards, header/back control, thin progress line, breadcrumbs, full-screen detail and vehicle panels, calendar, questionnaire, guest form, review cards and fixed bottom toolbar. Responsive desktop uses a centered mobile booking column. Original brand/vehicle photography and licensed map tiles are not copied; the preview uses custom SVG illustrations and a noninteractive map backdrop.

Approved catalog: Interior Detail, Exterior Detail, Full Detail Package, four vehicle sizes each, correct inclusions and duration, promotional pricing, no add-ons, quantity one, 5.5% tax and 50% deposit. Quote API calculates all amounts from package IDs on the server; submitted price fields are ignored. Changing services clears date/time and stale quote responses are ignored. Back/edit retains other form data. Private data stays in temporary component memory; photos remain local object URLs and are revoked on removal/unmount.

## Live launch blockers

- Approved geographic service area and Maps keys for autocomplete, geocoding and actual map.
- Approved working hours, resources/capacity and blackout dates; PostgreSQL configuration for authoritative availability and transactional slot holds.
- Appointment draft schema/repository and guest access tokens; live booking persistence is not implemented in this preview.
- Payment-provider test/live credentials, hosted card collection, payment orchestration, signed webhook processing and reconciliation; no charges or bookings are accepted.
- Private object storage and validated upload grants; preview photos are not uploaded.
- Verified email sign-in provider, transactional email/SMS and approved policies.

Sample time choices are visibly marked as preview. Add Card/BOOK NOW opens an explicit setup notice; it never claims a saved card, successful charge or confirmed appointment. Coupon and shop options are omitted because they are not part of the approved catalog.

## Changed files

- `src/app/page.tsx`: booking entry replaces foundation landing page.
- `src/components/booking/booking-flow.tsx`: complete preview journey.
- `src/app/styles.css`: reference layout styles and legacy-route compatibility.
- `src/app/api/booking/quote/route.ts`: validated authoritative quote endpoint.
- `src/modules/catalog-pricing/catalog.ts`: approved full-detail upholstery wording.
- `tests/page.test.tsx`, `tests/browser/foundation.spec.ts`: updated booking-entry expectations.
- `tests/booking-quote.test.ts`: tampering, duplicate/unknown package and invalid JSON checks.

## Validation

- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node node_modules/vitest/vitest.mjs run`: 9 files, 32 tests passed.
- `node node_modules/eslint/bin/eslint.js .`: zero errors, one image-optimization warning for local blob photo previews.
- `node node_modules/prettier/bin/prettier.cjs --check .`: passed.
- `node node_modules/next/dist/bin/next build`: passed.
- Browser: address → mobile menu → sedan → full detail → date/time → vehicle → utility questions → guest info → final review verified; $250 subtotal + $13.75 tax = $263.75 total, $131.88 deposit.
- Responsive browser: 390 × 844 address screen checked, no horizontal overflow.
- Existing browser-test suite not executed; interactive verification used the available browser tool. No real-database, provider sandbox, concurrency, webhook or upload integration checks were possible because those live capabilities are not configured/implemented.

## Run

Install the pinned dependencies with `pnpm install --frozen-lockfile`, then run `pnpm dev`. The current preview is http://127.0.0.1:3100/.

No deployment, live resources, commits or changes to the original deleted checkout were made. Next step is configuring and implementing the server booking/payment pipeline, then verifying it in provider sandboxes before launch.
