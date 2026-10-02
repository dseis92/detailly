# Product Specification

Status: Phase 0 planning baseline. Foundation defaults were approved on 2026-10-01; business-specific values remain unresolved and configurable.

## Approved foundation defaults

- One detailing business with multiple locations supported by the model.
- One Next.js application managed with `pnpm`, rather than a monorepo.
- Vercel as the initial deployment target and managed PostgreSQL as the production database category; local development uses PostgreSQL in Docker.
- Drizzle as the ORM/migration layer.
- Auth.js with guest checkout and email-based sign-in; no application-managed passwords by default.
- Configurable initial defaults of `en-US`, `USD`, and `America/Chicago`.
- No production services, live provider accounts, or other live resources are created during foundation work.

## Approved business rules

- The booking flow is **mobile service only**; there is no shop drop-off mode.
- The current catalog is defined in `SERVICE_CATALOG.md`.
- A 50% deposit is required before booking confirmation.
- Sales tax is 5.5% for the current baseline.
- Interior Detail is 10% off and Full Detail is 25% off, calculated against stored original prices.
- The current catalog has no selectable add-ons.

## Product goals

Build a mobile-first booking and customer-management product for an auto-detailing business that:

- lets a customer confidently price and schedule a mobile appointment with minimal backtracking;
- gives the business one authoritative record for services, availability, customers, vehicles, appointments, and payments;
- prevents invalid service areas, stale prices, unavailable slots, overlapping work, and duplicate charges;
- supports future branding and operational policy changes as configuration rather than code changes; and
- grows as a modular monolith before operational evidence justifies separate services.

Success measures will be finalized with the owner. Candidate measures are booking completion rate, median booking time, abandoned step, slot-hold expiry rate, payment success rate, rebooking rate, cancellation rate, and staff time spent correcting appointments.

## Users and roles

- **Guest customer:** explores serviceability and prices, creates a booking, and may claim an account afterward.
- **Customer:** manages profile, vehicles, bookings, saved payment references, gift cards, and memberships.
- **Staff:** views assigned work and customer/vehicle details needed to deliver it; updates permitted appointment states.
- **Manager:** manages the operating calendar, customers, services, availability, staff assignments, refunds within policy, and reporting.
- **Owner:** has manager capabilities plus business, location, policy, billing, role, and integration administration.
- **System actor:** records provider callbacks, expiration jobs, notifications, and auditable automated changes.

Authorization is deny-by-default and scoped to a business. Roles do not imply access across businesses.

## Customer booking journey

1. **Start with location.** Customer enters a street address using accessible autocomplete or manual entry. The server normalizes coordinates and verifies the applicable service area. A desktop layout may keep a contextual map and marker visible; the mobile layout prioritizes the form. Customers can adjust the marker where permitted.
2. **Confirm mobile service.** There is no shop mode. The flow confirms the address is eligible for mobile service and later asks about site utilities.
3. **Choose or describe a vehicle.** A signed-in customer can select a garage vehicle or add one. A guest adds one for the booking. Vehicle category is explicit because it can affect compatibility, price, and duration.
4. **Choose services.** Browse Interior Detail, Exterior Detail, and Full Detail Package groups. Package panels explain inclusions, savings label, exact promotional price, duration, and vehicle compatibility. The current catalog has no add-ons or tiered extras.
5. **Review live estimate.** The client previews price and duration as selections change. The server recalculates the authoritative quote from versioned menu and pricing data. Taxes, fees, discounts, deposit, and total are itemized.
6. **Choose date and time.** Calendar shows server-computed dates and appointment windows based on location, mode, vehicle, services, duration, staff/capacity, lead time, availability, blackout periods, and existing commitments. Selecting a slot creates a short-lived hold; expiry is visible and recoverable.
7. **Describe condition.** Add free-text condition/access notes and optional photos. File type, size, count, and purpose are validated. Images are private by default.
8. **Answer site questions.** Mobile bookings ask whether water and electricity are available, plus any owner-configured access questions. These answers can affect eligibility or pricing only through explicit rules.
9. **Identify the customer.** Continue as guest or authenticate. Collect name, email, phone, communication consent, and optional referral source. Avoid forcing account creation before checkout.
10. **Confirm details.** Show the mobile service location, appointment window in the business timezone, vehicle, services, customer details, notes/photos, subtotal, discounts/coupon, tax, fees, gift card, required 50% deposit, and total. Material changes require reconfirmation.
11. **Pay and book.** Collect card details with provider-hosted fields. The server creates or reuses an idempotent payment operation for the required prepayment. An appointment becomes confirmed only through the defined payment/booking state machine; retries do not duplicate bookings or charges.
12. **Receipt and next steps.** Confirmation includes a reference, appointment and payment state, policy summary, directions/access guidance, and portal/account-claim path. Email/SMS notifications are queued from committed state.

The flow supports back navigation without losing valid choices, invalidates downstream choices when prerequisites change, preserves keyboard focus across panels/modals, and never relies on color alone for status.

## Customer portal scope

- Upcoming and past bookings, status, receipts, reschedule/cancel actions allowed by policy.
- Profile, contact preferences, consent history, and account security.
- Garage: vehicles, categories, notes, and safe removal rules.
- Payment methods shown through provider references; no raw card data stored.
- Gift-card balance and history.
- Membership/subscription status, benefits, renewal, and cancellation where enabled.

## Business dashboard scope

- Calendar views, appointment detail, staff assignment, status workflow, notes, and conflict indicators.
- Service menus, nested groups, packages, add-ons, vehicle/category applicability, pricing rules, and publication/versioning.
- Customers, vehicles, booking/payment history, communication preferences, and privacy actions.
- Business locations, service areas, operating hours, availability rules, time off, capacity, and scheduling policies.
- Staff profiles, roles, location assignments, and scoped permissions.
- Payments, deposits, refunds, coupons, gift cards, memberships, and reconciliation-oriented exports.
- Notification templates/preferences and delivery outcomes.
- Audit history for security-sensitive and money/schedule-affecting changes.

Dashboard implementation is later work; Phase 0 defines its boundaries.

## Functional requirements

### Catalog, pricing, and quoting

- Model draft/published service menus with ordered nested groups, packages, and vehicle-category applicability. Keep add-on support dormant until a later approved release.
- Compute quote line items, duration, discounts, fees, taxes, deposit, and total on the server from effective, versioned rules.
- Snapshot customer-visible names, quantities, unit amounts, durations, and applied-rule identifiers onto appointment items so history does not change with the catalog.
- Explain unavailable or incompatible selections and revalidate every quote at hold and checkout.

### Location and serviceability

- Support one or more business locations, each with a timezone and supported fulfillment modes.
- Normalize addresses through a provider boundary; store provider-neutral address components and coordinates.
- Evaluate configurable polygon/radius/postal service areas and explicit inclusions/exclusions on the server.
- Preserve the entered address separately from provider response metadata needed for later diagnosis.

### Scheduling

- Compute availability from duration, buffers, business/location hours, fulfillment mode, staff/capacity, appointment commitments, time off, lead time, horizon, and local-time/DST rules.
- Use expiring slot holds and transactional final checks so concurrent customers cannot claim the same constrained capacity.
- Store instants in UTC, retain the business timezone used to interpret the schedule, and render explicit timezones.
- Maintain appointment status history and authorize valid transitions.

### Checkout and payments

- Support guest and authenticated checkout without duplicating customer/vehicle records.
- Use provider tokens/references for payment methods; never store PAN/CVC.
- Require configurable fixed/percentage/full prepayment and disclose the remaining balance.
- Process payment/webhook operations idempotently; tolerate duplicate and out-of-order events.
- Support recorded refunds, coupons, gift cards, and later membership benefits without silently changing historical totals.

### Media and notifications

- Upload images directly to private object storage using short-lived server-issued grants; finalize only validated objects.
- Queue transactional email and optional consented SMS after the related database commit.
- Record notification template/version, destination metadata, provider reference, state, attempts, and error category.

### Administration and audit

- Enforce customer, staff, manager, and owner permissions on the server.
- Record actor, action, target, request/correlation identifier, and safe before/after summaries for sensitive changes.
- Provide configurable data instead of embedded branding, prices, boundaries, hours, deposits, taxes, cancellation policy, or notification rules.

## Nonfunctional requirements

- **Reliability:** critical mutations are transactional, retry-safe, and observable. Background work uses durable jobs/outbox semantics.
- **Performance:** define budgets during UI implementation; target responsive input, progressive loading, optimized images, and bounded availability queries.
- **Scalability:** business scoping and indexed temporal/geospatial access patterns support multiple locations and future tenants without premature service splitting.
- **Maintainability:** strict TypeScript; cohesive modules; explicit domain interfaces; migrations and architectural decisions reviewed with code.
- **Compatibility:** responsive evergreen-browser experience with resilient mobile behavior; graceful manual address entry when autocomplete is unavailable.
- **Recovery:** automated database backups, tested restoration, provider reconciliation, and replayable idempotent jobs before production launch.
- **Localization:** currency, locale, timezone, and formatting are explicit even if MVP initially supports one market.

## Accessibility requirements

- Target WCAG 2.2 AA.
- Full keyboard operation, visible focus, logical focus management, semantic headings/landmarks, labels/instructions, and accessible validation summaries.
- Autocomplete, calendar, dialogs, segmented choices, disclosures, and file upload follow established ARIA patterns and work with common screen readers.
- Minimum touch targets, sufficient contrast, reduced-motion support, zoom/reflow through 400%, and no color-only meaning.
- Price and schedule updates are announced without disrupting focus; time limits such as slot expiry can be extended where policy and capacity allow.
- Automated checks supplement, not replace, manual keyboard and screen-reader testing.

## Security and privacy requirements

- Validate all untrusted input on the server and encode output by context.
- Use secure, HttpOnly, SameSite cookies, CSRF defenses where applicable, session rotation, rate limits, and strong account-recovery controls.
- Enforce business/record authorization at every server entry point; protect staff/owner actions with stronger authentication and optional MFA.
- Use least-privilege credentials, environment-separated secrets, encryption in transit/at rest, secret rotation, and redacted structured logs.
- Minimize personal data, document purposes and retention, record communication consent, and support access/correction/deletion requests subject to legal/financial retention.
- Keep uploads private, scan/validate content, use randomized object keys, and serve through short-lived authorized URLs.
- Minimize PCI scope with Stripe-hosted payment UI; persist only payment/customer/method identifiers and safe card display metadata.
- Verify webhook signatures from raw request bodies, prevent replay, and audit money/status changes.
- Establish dependency, SAST, secret-scanning, backup/restore, incident-response, and vulnerability-management procedures before launch.

## Explicit assumptions

- MVP serves one business but every operational record is business-scoped to avoid a costly future tenancy rewrite. Multiple locations are supported.
- A business may have multiple physical locations and each location may define a timezone; the appointment snapshots the scheduling timezone.
- English and one settlement currency are acceptable for MVP, while schema and formatting remain currency/locale aware.
- Service duration can influence availability and can vary by package, vehicle category, add-ons, or explicit pricing/duration rules.
- The current business offers mobile service only. The model may retain a future fulfillment-mode seam, but no shop mode should appear in the MVP UI or fixtures.
- Guest checkout is permitted unless the owner later decides otherwise.
- Demo fixtures, if added later, will be clearly marked and cannot be mistaken for production policy.

## Unresolved business questions

1. Final business name, logo, voice, accent color, domains, legal entity, support contacts, and receipt details.
2. Currency, locale, tax-jurisdiction confirmation, taxable items/fees, and exact rounding policy for reconstructing original promotional prices. The current baseline is USD, en-US, and 5.5% sales tax.
3. Exact mobile service-area boundaries, travel fees, excluded zones, address/marker tolerance, and operating locations.
4. Operating hours, booking horizon, lead time, slot interval, arrival windows, buffers, capacity model, concurrent jobs, and staff assignment rules.
5. Staff structure, permissions, commission/time-tracking needs, and whether customers select a staff member.
6. Vehicle categories and edge cases (oversize, commercial, motorcycle, boat, pet hair, hazardous condition).
7. Future service hierarchy changes, add-ons, tier choices, compatibility, and upsell rules. Current prices, durations, vehicle categories, and inclusions are approved in `SERVICE_CATALOG.md`.
8. Water/electricity requirements and outcomes when either is unavailable.
9. Remaining-balance collection after the approved 50% deposit, tips, no-show/cancellation/reschedule policy, disputes, and refund authority.
10. Coupon stacking, gift-card rules, membership benefits/renewal, and accounting treatment.
11. Photo limits, accepted content, operational visibility, retention, and customer deletion behavior.
12. Required contact fields, guest-account matching, referral options, marketing consent, and email/SMS notification events/preferences.
13. Data retention, privacy-request process, age requirements, terms, privacy policy, and jurisdiction-specific compliance.
14. Accessibility acceptance process and supported browser/device/screen-reader matrix.
15. Success metrics, analytics consent, reporting/export requirements, and accounting integrations.

## MVP versus later releases

### MVP

- Configurable branding, business/location settings, mobile service areas, vehicle categories, service menus, pricing, availability, blackout periods, and deposits.
- Complete address-first mobile booking flow, accessible autocomplete/manual address, map marker, eligibility, vehicle, packages, quote, slot hold, notes/photos, utilities, guest/account checkout, confirmation, Stripe card prepayment, and receipts.
- Customer authentication, profile, garage, and booking history/basic policy actions.
- Operational dashboard for calendar, appointment/customer detail, core catalog/availability configuration, staff roles, payment/refund visibility, and audit events.
- Transactional email and essential opted-in SMS.

### Later releases

- Advanced memberships/subscriptions, gift-card purchase flows, loyalty/referrals, tips, waitlists, recurring/fleet bookings, route optimization, staff commissions, inventory, richer CRM/marketing, accounting integrations, native apps, multi-currency/localization, and multi-business SaaS controls.
- Optimization should follow measured operational need; later scope must not weaken booking/payment invariants.
