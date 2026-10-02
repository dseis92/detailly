# Implementation Plan

Each phase is independently reviewable and requires explicit approval before the next. Business decisions are resolved only as needed and represented as configuration.

## Phase 0 — Planning and repository foundation (current)

- **Objective:** establish aligned product, architecture, data, delivery, environment, and contributor guidance.
- **In scope:** repository assessment; `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, this plan, concise `CLAUDE.md`, `.env.example`, official-source research record, minimal ignore policy.
- **Out of scope:** application scaffold, dependencies, migrations, UI, providers, accounts, deployment, fixtures, live credentials.
- **Expected files/modules:** planning documents only.
- **Data changes:** none.
- **Required tests:** document existence/section checks, cross-document terminology review, env secret-pattern scan, Markdown hygiene, Git/workspace status inspection.
- **Completion criteria:** every requested document exists and agrees; reference flow and entities are covered; business unknowns explicit; phases have testable gates; checks pass or exact failures are reported; only intentional files changed.
- **Risks:** empty/non-Git workspace limits baseline/diff evidence; provider guidance changes; unresolved policy may alter later design.

## Phase 1 — Executable foundation and continuous validation

- **Objective:** create a production-shaped, locally runnable strict TypeScript modular monolith with repeatable CI checks.
- **In scope:** Next.js scaffold; package/runtime pinning; formatting/lint/typecheck/unit/build/browser-smoke scripts; module layout; validated configuration; PostgreSQL development/test setup; Drizzle migration harness; health endpoint; error/log/trace foundations; CI; architecture decision records for final provider/version choices.
- **Out of scope:** customer-facing booking features, real business data, live provider resources.
- **Expected files/modules:** `src/app`, `src/modules`, `src/lib/config`, `src/lib/db`, `tests`, Playwright/Vitest/TypeScript/Drizzle configs, CI workflow, ADRs.
- **Data changes:** initial migration for business/location foundation and migration metadata; clearly labeled local seed only if useful.
- **Required tests:** config validation, module boundary checks, DB connectivity/migration round trip, health endpoint, first accessible browser smoke, clean production build.
- **Completion criteria:** fresh documented setup passes install, lint, strict typecheck, unit/integration, production build, and browser smoke; migration up/down strategy is reviewed; no secrets committed.
- **Risks:** version incompatibility, environment drift, serverless/database pooling; mitigate with pinned versions, lockfile, supported runtimes, and real-Postgres CI.

Approved inputs for this phase (2026-10-01): one Next.js application managed with `pnpm`; strict TypeScript; Drizzle; local PostgreSQL in Docker; managed PostgreSQL and Vercel as production targets; Auth.js with guest checkout and email sign-in; configurable `en-US`, `USD`, and `America/Chicago` defaults; no live production resources.

## Phase 2 — Identity, business configuration, and authorization

- **Objective:** establish secure actors, tenant boundaries, roles, locations, and configuration administration.
- **In scope:** sessions/authentication, email verification, customer/staff linkage, business memberships/roles, owner bootstrap, location/timezone/fulfillment configuration, authorization policies, audit events, minimal admin shell.
- **Out of scope:** service catalog, appointment booking, payments.
- **Expected files/modules:** `identity-access`, `business-config`, `audit-observability`, auth routes/UI, policy tests.
- **Data changes:** users, auth adapter tables, businesses, memberships/roles, customers, staff, locations, audit events.
- **Required tests:** authentication/session rotation, deny-by-default policies, cross-business isolation, role matrix, owner bootstrap, timezone validation, audit redaction, keyboard/accessibility checks.
- **Completion criteria:** every endpoint/use case enforces actor and scope; role matrix passes; no cross-business access in adversarial tests; privileged changes are audited.
- **Risks:** account linking/takeover, overbroad roles, lockout; mitigate with verification, explicit linking, recovery path, least privilege, optional staff MFA.

## Phase 3 — Catalog, vehicle, serviceability, and authoritative quotes

- **Objective:** make configurable offerings and produce explainable, server-authoritative estimates.
- **In scope:** vehicle categories/garage basics; versioned menus/groups/packages/add-ons/tiers; pricing/duration rules; location/mode applicability; address provider adapter, manual address, map marker, service-area checks; quote calculator and admin configuration.
- **Out of scope:** calendar holds, appointment checkout, charges.
- **Expected files/modules:** `catalog-pricing`, `customers-vehicles`, `serviceability`, maps adapter, quote API/UI, catalog admin.
- **Data changes:** vehicles/categories, menus/groups/packages/add-ons/rules, service areas, quote/booking-attempt records if approved.
- **Required tests:** pricing equations and property cases, rule precedence/stacking, immutable publication, compatibility, address normalization, boundary cases, provider failure/manual fallback, tenant isolation, accessible autocomplete/map alternative.
- **Completion criteria:** owner-configured demo menu can publish; supported/unsupported addresses are explainable; same versioned input deterministically yields matching price/duration server results; client manipulation cannot alter quote.
- **Risks:** ambiguous rules, geocoder/licensing constraints, stale quotes; mitigate with rule DSL limits, provenance, expiry/version fingerprints, manual path.

## Phase 4 — Availability, slot holds, and concurrency

- **Objective:** return trustworthy appointment windows and reserve capacity without overlaps.
- **In scope:** availability rules, time off/blackouts, staff/resource capacity, duration/buffers, local-time conversion, slot search, expiring holds, cleanup, conflict enforcement, basic calendar administration.
- **Out of scope:** payment and final customer booking completion.
- **Expected files/modules:** `availability`, worker jobs, calendar APIs/UI, concurrency test harness.
- **Data changes:** availability rules, time off, capacity/resource assignments, slot holds and indexes/constraints.
- **Required tests:** DST ambiguous/nonexistent times, lead/horizon/buffer rules, expiration, parallel holds/confirm simulations, capacity greater than one, database constraint/locking, query performance.
- **Completion criteria:** deterministic slot results for approved fixtures; two concurrent requests cannot exceed capacity; expired holds never block reads even before cleanup; performance target met on representative data.
- **Risks:** timezone errors, contention, complex staff assignment; mitigate with UTC intervals/IANA zones, DB constraints/locks, explainable capacity model.

## Phase 5 — Booking flow, uploads, and customer portal core

- **Objective:** deliver the complete non-payment booking workflow and foundational self-service experience.
- **In scope:** mobile-first step flow, progress/backtracking, vehicle create/select, nested packages/add-ons, live quote, calendar/hold, condition notes/private photos, water/electricity/site questions, guest/auth contact, referral, confirmation review; appointment draft/state/history; portal profile/garage/bookings.
- **Out of scope:** real charge confirmation, advanced dashboard, gift-card purchase/membership billing.
- **Expected files/modules:** `booking`, `assets`, customer booking routes/components, portal routes, upload adapter.
- **Data changes:** appointments/items/history, assets/attachments, site answers and immutable snapshots.
- **Required tests:** mobile/desktop end-to-end happy path, back/edit invalidation, hold expiry recovery, upload validation/authorization/orphan cleanup, guest/account linking, server tamper tests, keyboard/screen-reader/manual accessibility review.
- **Completion criteria:** a customer can create a payment-pending appointment from an eligible address with all required snapshots; unauthorized users cannot access it; all 13 pre-payment reference-flow capabilities are demonstrated with test evidence.
- **Risks:** long flow abandonment, stale downstream state, upload abuse; mitigate with progressive steps, clear persistence/expiry, dependency graph invalidation, strict grants/scanning.

## Phase 6 — Payments, webhooks, refunds, and confirmation

- **Objective:** safely collect configured prepayment and confirm a booking exactly once.
- **In scope:** Stripe adapter/Payment Element, customer/payment references, PaymentIntent orchestration, signed webhook inbox, durable processing, appointment confirmation, receipts, configurable deposit/full prepay, coupon application if approved, refunds/reconciliation/operator visibility.
- **Out of scope:** broad subscription/membership billing, live production activation without separate launch approval.
- **Expected files/modules:** `payments`, webhook route/worker, checkout payment UI, reconciliation jobs, payment/refund admin views.
- **Data changes:** payments, refunds, provider events, idempotency records, coupon/redemption as approved, appointment balance fields.
- **Required tests:** provider sandbox contracts, client tampering, declines/retries, duplicate/reordered/delayed webhooks, signature failure, concurrent submits, refund limits, reconciliation, no raw card data, browser confirmation.
- **Completion criteria:** one booking attempt cannot create duplicate appointment or charge; signed events converge to correct states in any tested order; totals reconcile; failed payment preserves a recoverable hold/policy outcome; audit trail complete.
- **Risks:** money/state divergence, webhook delays, PCI expansion; mitigate with hosted fields, idempotency, inbox/state machine, reconciliation and restricted metadata.

## Phase 7 — Notifications and operational dashboard MVP

- **Objective:** equip the business to operate appointments and keep customers informed.
- **In scope:** transactional outbox, email and opted-in SMS adapters, templates/preferences/status callbacks; calendar/detail, assignment/status, customers, core catalog/availability, roles, payments/refunds, notification and audit views.
- **Out of scope:** advanced analytics/CRM, routing, payroll/commission, marketing automation.
- **Expected files/modules:** `notifications`, worker/adapters, dashboard feature areas, operations runbooks.
- **Data changes:** outbox/jobs, notifications/attempts, preferences/consent, staff assignments.
- **Required tests:** exactly-once logical sends under retries, consent enforcement, callback idempotency, template escaping, role/field authorization, dashboard critical browser journeys, accessibility and responsive review.
- **Completion criteria:** operators can fulfill the approved lifecycle without direct DB/provider-console edits; transactional messages are traceable and replay-safe; each dashboard action is authorized and auditable.
- **Risks:** duplicate messages, PII exposure, overpowered dashboard; mitigate with logical send keys, redaction, scoped policies, staged permissions.

## Phase 8 — Hardening, launch readiness, and controlled release

- **Objective:** prove production fitness and launch through an explicitly approved environment process.
- **In scope:** threat model/security review, accessibility conformance review, load/performance, backup/restore, data retention/privacy workflows, dependency/secret scans, observability/alerts/runbooks, provider reconciliation, staging acceptance, incident/rollback drills, business fixture import and training.
- **Out of scope:** unapproved later-release features; creation of live accounts/resources without owner authorization.
- **Expected files/modules:** runbooks, launch checklist, threat model, accessibility report, load/restore scripts, dashboards/alerts configuration.
- **Data changes:** approved production configuration and migration rehearsal; retention jobs.
- **Required tests:** full CI/E2E, OWASP-oriented security checks, manual assistive-tech matrix, representative load/concurrency, backup restoration, failure injection for providers/jobs, staging business acceptance.
- **Completion criteria:** all launch checklist owners sign off; critical/high findings resolved; recovery objectives demonstrated; business rules and legal copy approved; rollback/reconciliation/runbooks exercised; production action separately authorized.
- **Risks:** unknown peak load, policy gaps, provider incidents, operational inexperience; mitigate with limits, phased rollout, alerts, fallback procedures, training.

## Later release tracks

Gift-card sales, advanced memberships/subscriptions, loyalty/referrals, waitlists, recurring/fleet work, routing, staff commission/time tracking, accounting integrations, localization/multi-currency, native apps, and multi-business SaaS are separate plans with their own schema, security, payment, and acceptance review.
