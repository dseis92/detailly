# Architecture

Status: Phase 0 foundation approved on 2026-10-01. Validate provider contracts and unresolved business rules before their implementation phases. Supporting primary-source notes live in `STACK_RESEARCH.md`.

## Recommended stack

- **Application:** Next.js App Router with React and strict TypeScript. One deployable web application supports responsive customer and staff experiences, server-rendered public flows, route handlers, and server-side mutations without splitting the product prematurely.
- **Runtime/package management:** active Node.js LTS and `pnpm`, pinned by repository metadata once scaffolded. Exact versions are selected during Phase 1 from current official compatibility guidance and committed lockfiles.
- **Database:** managed PostgreSQL with Drizzle ORM and SQL migrations. PostgreSQL provides transactions, constraints, range/exclusion capabilities, and geospatial extension options; Drizzle keeps the schema close to SQL and domain persistence explicit. Use PostGIS only if service-area queries require it.
- **Validation/contracts:** Zod at HTTP, form, job, provider, and configuration boundaries. Domain constructors additionally enforce invariants.
- **Authentication:** Auth.js-compatible application sessions with a database adapter, verified email-based sign-in, secure cookie sessions, role assignments, and optional staff MFA. Guest checkout remains separate and application-managed passwords are excluded by default. Keep the domain `User` and roles independent of the auth provider so a managed provider can replace it.
- **Payments:** Stripe Payment Element/Payment Intents, Customers, Setup Intents where needed, and signed webhooks through an adapter.
- **Maps/address:** Google Maps Places autocomplete and Maps JavaScript rendering through provider-neutral geocoding/map interfaces; always offer manual address entry.
- **Uploads:** private S3-compatible object storage with presigned direct uploads and a finalize step.
- **Notifications:** durable outbox/job processing with email (initial candidate: Resend) and SMS (initial candidate: Twilio) adapters.
- **Testing:** Vitest for unit/integration tests, Testing Library for component behavior, Playwright for browser journeys, and real PostgreSQL in persistence/transaction tests.
- **Operations:** Vercel is the approved initial web-host target with a managed PostgreSQL provider, object storage, managed queue/cron, and OpenTelemetry-compatible telemetry. Local development uses PostgreSQL in Docker. Keep services portable through interfaces and standard protocols.

Tradeoff: this stack optimizes iteration and one-language ownership. It accepts framework coupling in the delivery layer and requires care around serverless connection pooling, long-running jobs, and regional database latency. A modular monolith keeps deployment simple while domain seams preserve an extraction path.

## Component boundaries

```text
Customer Web / Staff Web
          |
Next.js delivery layer (pages, route handlers, server actions)
          |
Application use cases (book, quote, hold slot, refund, publish menu)
          |
Domain modules + ports
          |
PostgreSQL repositories | Stripe | Maps | Object storage | Email/SMS | Jobs
```

Suggested modules:

- `identity-access`: sessions, users, roles, business membership, authorization policies.
- `business-config`: businesses, locations, timezone, branding, operational policies.
- `catalog-pricing`: menus, groups, packages, applicability, pricing/duration/tax/deposit calculation; add-on support remains dormant until approved.
- `serviceability`: address normalization, coordinates, service-area rules, fulfillment eligibility.
- `availability`: working rules, capacity/resources, time off, slot generation, holds, conflict detection.
- `customers-vehicles`: customer profiles, consent, garages, vehicle classification.
- `booking`: booking workflow, appointments, items, status transitions, condition/site answers.
- `payments`: payment intents, applied value, refunds, coupons, gift cards, memberships, reconciliation.
- `assets`: upload grants, validation/finalization, authorization, retention.
- `notifications`: outbox, templates, preferences, provider delivery.
- `audit-observability`: audit events, correlation, metrics, safe structured logging.

Modules expose application-facing interfaces and domain values, not ORM rows or provider SDK objects. Cross-module mutations run through explicit use cases and a shared transaction boundary.

## Responsibilities

### Browser

- Render progressive, responsive, accessible interactions and client-side hints.
- Hold ephemeral form state, request autocomplete suggestions, render provider maps, and upload directly with server-issued grants.
- Display estimates and availability, while treating them as provisional until server confirmation.
- Use provider-hosted card fields; never receive or persist raw card data in application state.

### Server

- Authenticate and authorize every operation; validate and normalize input.
- Calculate authoritative price, duration, tax, fee, discounts, deposit, and totals.
- Validate serviceability and availability; create expiring holds; orchestrate idempotent booking/payment state changes.
- Issue narrowly scoped upload grants, process provider callbacks, queue notifications, and emit audit/telemetry events.

### Database

- Store durable business, customer, catalog snapshots, scheduling, appointment, payment-reference, notification, and audit state.
- Enforce keys, ownership, valid scalar ranges, uniqueness/idempotency, and scheduling conflicts where practical.
- Coordinate critical writes with transactions and row/advisory locks or exclusion constraints.
- Store money in integer minor units plus ISO currency; store instants as timezone-aware UTC values and location/business timezone identifiers separately.

## Domain layer boundaries and key interfaces

Framework-free TypeScript domain code should depend on ports such as:

- `QuoteCalculator.quote(input, at)` returns immutable line items, duration, totals, currency, rule/menu versions, and expiry.
- `ServiceabilityPolicy.evaluate(location, fulfillment, address)` returns eligibility and explainable rule outcomes.
- `AvailabilityService.search(criteria)` and `SlotReservationPort.hold/confirm/release(...)` operate in instants plus explicit timezone.
- `AppointmentRepository` persists aggregates with optimistic versioning inside a transaction.
- `PaymentGateway.createOrReuseIntent`, `capture`, `refund`, and `parseVerifiedEvent` use internal commands/results.
- `UploadStore.issueGrant/finalize/deleteAuthorized`, `NotificationSender.send`, and `JobQueue.enqueue` hide SDK shapes.

Domain clocks and ID generation are injected for deterministic tests. Rules use effective dates and stable identifiers. Confirmed appointment item snapshots are historical facts, not live catalog projections.

## Authentication and authorization

- Authenticate through secure HttpOnly cookie sessions; rotate sessions at authentication/privilege changes and expire/revoke server-side.
- Model a `User` identity separately from `Customer` and `StaffMember`. Business membership carries one or more roles: customer, staff, manager, owner.
- Application use cases receive an actor and business scope and apply resource-level policies. UI hiding is convenience, never enforcement.
- Guests receive an opaque, short-lived checkout/appointment access token; claiming an account requires verified ownership and controlled record linking.
- Require verified email for durable accounts; support stronger authentication/MFA for privileged roles before launch.
- Audit login/security events, role changes, exports, refunds, and sensitive record access without logging secrets.

## Payments and webhooks

1. Server creates an immutable quote and slot hold within a booking attempt.
2. Checkout use case recalculates totals and creates/reuses a Stripe PaymentIntent using a stable internal idempotency key and metadata containing opaque internal IDs.
3. Browser confirms payment via Stripe-hosted UI. The client result is informative, not final authority.
4. Signed webhooks are verified from the raw body, inserted into a `provider_event` inbox with a unique provider event ID, acknowledged quickly, then processed asynchronously.
5. Processing locks/reloads payment and appointment state, applies only valid monotonic/state-machine transitions, records the event/result, and safely ignores duplicates or stale events.
6. Appointment confirmation and slot consumption occur transactionally according to the chosen authorization/capture policy. A reconciliation job finds divergent or stuck states.

Store all monetary values in minor units with currency and purpose. Persist provider IDs and safe display metadata only. Refund commands have their own idempotency keys and append-only records. Never infer final payment state only from redirect query parameters or webhook arrival order.

## Availability and concurrency

- Convert local operating rules to UTC intervals with an IANA timezone and explicit DST tests.
- Generate candidates, then subtract blackout/time-off and consumed capacity; include service duration and buffers.
- Holds have server-generated expiry and do not become permanent availability facts.
- At hold and confirmation, rerun constraints inside a transaction. Prefer a database exclusion constraint on protected resource/time ranges; use transactional locks for capacity pools that cannot be expressed as a simple exclusion.
- Clean up expired holds through indexed queries/jobs, while every read treats expired holds as inactive even before cleanup.

## File uploads

1. Authorized server validates declared purpose, count, content type, and size, creates an `UploadedAsset` in pending state, and returns a short-lived presigned request for a randomized object key.
2. Browser uploads directly to private storage.
3. Server finalizes only after metadata/content checks; optional malware/image processing runs asynchronously.
4. Access uses authorization-checked short-lived download URLs, never public buckets.
5. Orphaned/pending objects expire; appointment/user deletion applies documented retention and legal-hold rules.

Do not trust filename, MIME header, dimensions, or client-reported completion. Strip unsafe metadata where appropriate.

## Notifications

Use a transactional outbox written with the source state change. A worker turns outbox events into notification records, applies consent/preferences and template version, then sends through email/SMS adapters. Provider callbacks update delivery states idempotently. Retries use bounded exponential backoff and a dead-letter/operations view. Keep booking success independent of provider latency; send neither marketing messages without consent nor duplicate transactional messages for replayed events.

## Deployment model

- One Next.js application deployment containing customer, portal, dashboard, and HTTP endpoints.
- One PostgreSQL database per environment with pooling appropriate to the runtime.
- Separately invokable worker/queue consumer from the same codebase for webhooks, notifications, asset processing, hold cleanup, and reconciliation.
- Private object storage and managed queues/cron by environment.
- Preview/staging/production isolation for database, buckets, Stripe modes/webhook secrets, auth origins, and notification credentials.
- Forward-only reviewed migrations with expand/migrate/contract for risky changes; migrations do not run implicitly on arbitrary web instance startup.

Do not deploy or create live resources in Phase 0.

## Observability

- Structured JSON logs with correlation/request, actor type, business, appointment/payment opaque IDs, operation, result, and latency; redact contact data, addresses, tokens, and provider payload secrets.
- OpenTelemetry traces across requests, database calls, queues, and provider adapters.
- Metrics for booking funnel, quote/availability latency, slot conflicts, payment outcomes, webhook age/failures, notification failures, job retries, and authorization denials.
- Error tracking with source maps and release identifiers; alerts tied to user impact and runbooks.
- Audit events are durable product/security records and are distinct from diagnostic logs.

## Testing strategy

- **Domain unit tests:** table/property tests for pricing, duration, taxes, deposits, coupons, state machines, timezone/DST conversion, and authorization.
- **Persistence integration tests:** real PostgreSQL for constraints, transactions, migrations, concurrent hold/confirmation attempts, idempotency, and tenant scoping.
- **Adapter contract tests:** recorded/sandbox provider responses for maps, Stripe, storage, email, and SMS without embedding SDK objects in domain tests.
- **Component/accessibility tests:** semantic queries, keyboard behavior, validation, focus, and live updates.
- **Browser tests:** Playwright journeys for mobile/desktop guest and account bookings, unavailable addresses, expired holds, declined/retried payment, and core dashboard authorization.
- **Webhook/job tests:** duplicate, reordered, delayed, malformed, and replayed events plus retry/dead-letter behavior.
- **Operational checks:** migrations on production-like data, backup restoration, provider reconciliation, performance/load on availability/checkout, and manual accessibility/security review.

CI eventually runs formatting, lint, strict type checking, unit/integration tests, production build, browser smoke tests, migration validation, and secret/dependency scans.

## Risks and mitigations

| Risk                                      | Mitigation                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Unresolved operating policy causes rework | Model policy as versioned configuration; approve business decisions before dependent phases.                                     |
| Pricing shown differs from charge         | One server calculator, immutable quote/appointment snapshots, recalculation at checkout, explicit material-change confirmation.  |
| Double booking under concurrency          | Expiring holds plus transactional final checks, database-enforced conflicts/capacity locks, concurrency tests.                   |
| Payment and booking states diverge        | Idempotent commands, durable webhook inbox/outbox, state machines, reconciliation and operator tooling.                          |
| DST or multi-location errors              | IANA timezone per location, UTC instants, explicit ambiguous/nonexistent-time tests, timezone snapshot.                          |
| Provider lock-in/outage                   | Narrow adapters, manual address path, asynchronous notifications, retry/circuit policies, portable PostgreSQL/storage protocols. |
| Uploaded content exposes data or code     | Private storage, randomized keys, validation/scanning, authorized short-lived access, retention jobs.                            |
| Serverless limits harm jobs/database      | Pooling, region colocation, queued workers, bounded tasks, load tests, option to move worker without splitting domains.          |
| Staff sees excessive customer data        | Least-privilege roles, field/resource policies, audits, retention/minimization, security review.                                 |
| Scope expands beyond MVP                  | Phase gates, explicit out-of-scope lists, and reviewer approval before each phase.                                               |
