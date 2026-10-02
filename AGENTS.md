# Repository Instructions

## Sources of truth

- Read `PRODUCT_SPEC.md` for approved scope, journeys, requirements, assumptions, and unresolved business decisions.
- Read `ARCHITECTURE.md` before changing boundaries, providers, security, scheduling, payments, uploads, deployment, or testing.
- Read `DATA_MODEL.md` before changing persistence or lifecycle behavior and `IMPLEMENTATION_PLAN.md` before starting a phase.
- Treat unresolved business choices as configuration or an explicit blocker; never promote demo fixtures into policy.

## Before changing the repository

Inspect repository instructions, current branch/status/diff, scripts, dependencies, tests, environment patterns, and nearby conventions. Preserve unrelated work. Work only in the authorized phase and record material architecture decisions.

## Implementation rules

- Use strict TypeScript and validate untrusted input on the server.
- Keep domain modules independent of UI, ORM rows, and provider SDK types. Authoritative pricing, duration, serviceability, availability, deposits, and appointment totals run on the server.
- Represent money in integer minor units plus currency. Store instants in UTC and interpret schedules with the explicit business/location IANA timezone.
- Preserve business scoping, published versions, appointment snapshots, authorized status transitions, and non-overlapping/capacity-safe confirmed schedules.
- Make booking, payment, refund, webhook, notification, and job operations idempotent. Process duplicate and out-of-order provider events safely.
- Enforce customer/staff/manager/owner authorization at server boundaries. Keep secrets and sensitive data out of source, URLs, logs, fixtures, and test artifacts.
- Build accessible semantics, keyboard behavior, focus handling, error recovery, responsive layouts, and reduced motion into acceptance criteria.
- Add tests at the cheapest meaningful layer; use real PostgreSQL for constraints, transactions, migrations, and concurrency behavior.

## Validation and changes

Run the repository-defined format/lint, strict typecheck, unit/integration, build, and relevant browser tests before handoff. During Phase 0, run document/secret/status checks because executable scripts do not yet exist. Report every command and exact result; label skipped or failed checks.

Database changes require reviewed forward migrations, rollback/recovery notes, compatibility analysis, and production-like migration tests. Payment changes require state-machine, idempotency, duplicate/reordered webhook, reconciliation, and provider-sandbox evidence. Never create live resources or deploy without explicit authorization.

## Handoff

Report: repository assessment; files changed; decisions and tradeoffs; unresolved questions; validation commands with exact results; Git diff/status summary; risks; and recommended next phase. Stop at the current phase gate for review.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
