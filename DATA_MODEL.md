# Conceptual Data Model

Status: Phase 0 conceptual model; not a migration specification.

## Cross-cutting conventions

- Use opaque UUID/ULID-style identifiers at external boundaries. Every operational record is scoped to `business_id`, including records indirectly owned through another aggregate.
- Store monetary amounts as signed/unsigned **integer minor units** as appropriate, always paired with ISO 4217 `currency`; never use floating point for money.
- Store event instants in UTC (`timestamptz`). Store local recurring schedule values separately and interpret them with an explicit IANA `timezone` on the location/business. Snapshot the timezone on appointments.
- Use `created_at`, `updated_at`, and optional optimistic `version` where concurrency matters. Mutable entities generally use status/archival timestamps rather than destructive deletion.
- Preserve appointment, money, consent, notification, and audit history according to approved retention policy. Pseudonymize personal fields when legal deletion is compatible with required financial/operational records.
- Database constraints enforce ownership references, nonnegative amounts/durations, temporal ordering, uniqueness/idempotency, and schedule conflicts where expressible.

## Entities

### Business

- **Ownership:** root tenant/operating entity.
- **Important fields:** `id`, legal/display names, slug, default currency/locale/timezone, configurable branding, support contact, policy/config versions, status.
- **Relationships:** owns locations, users through memberships/roles, customers, staff, catalogs, appointments, financial instruments, notifications, and audits.
- **Invariants:** slug unique; supported currencies/config valid; all child access business-scoped.
- **Deletion/retention:** deactivate rather than delete; final removal requires export and cascading retention review.

### Location

- **Ownership:** business.
- **Important fields:** name, structured address, coordinates, IANA timezone, supported fulfillment modes, contact/display instructions, status.
- **Relationships:** has service areas, availability, time off, staff assignments, menus, and appointments.
- **Invariants:** timezone required; coordinates/address validated; only active locations are bookable.
- **Deletion/retention:** archive; historical appointments keep location/address/timezone snapshots.

### ServiceArea

- **Ownership:** business and normally location.
- **Important fields:** name, mode, geometry/radius/postal rule, priority, inclusion/exclusion, travel fee rule reference, effective interval, status/version.
- **Relationships:** evaluated for booking address; may select pricing/eligibility rules.
- **Invariants:** valid geometry and nonambiguous precedence; server evaluation is authoritative.
- **Deletion/retention:** expire/archive; quote/appointment retains applied rule ID and result.

### User

- **Ownership:** global identity with business memberships; personal linkage remains explicitly scoped.
- **Important fields:** normalized email/phone, verification states, auth subject/provider, session/security metadata, status.
- **Relationships:** may link to customer profiles and staff members; roles belong to business membership, not the global row.
- **Invariants:** normalized login identifiers unique according to auth policy; credentials/tokens never stored in plaintext.
- **Deletion/retention:** revoke/anonymize per privacy policy; keep necessary actor pseudonyms in audits.

### Customer

- **Ownership:** business; optionally linked to a user.
- **Important fields:** name, email, phone, locale, referral source, communication preferences/consent timestamps, merge status.
- **Relationships:** owns vehicles, appointments, gift cards/memberships, saved provider customer/payment references, assets.
- **Invariants:** guest and account records can be merged only through verified, auditable rules; contact normalization does not alone prove identity.
- **Deletion/retention:** anonymize when allowed; financial/appointment facts retained as required.

### StaffMember

- **Ownership:** business; linked to a user when interactive access exists.
- **Important fields:** display name, role/capability assignments, active status, optional scheduling capacity and provider references.
- **Relationships:** assigned to locations, availability/time off, appointments, and audit actions.
- **Invariants:** active assignments stay within the business; privileged roles require authenticated users.
- **Deletion/retention:** deactivate; retain historical assignments and actor attribution.

### Vehicle

- **Ownership:** business/customer.
- **Important fields:** nickname, year/make/model, color, optional plate/VIN with heightened privacy, `vehicle_category_id`, notes, status.
- **Relationships:** used by appointments; may have assets and customer ownership history if transfer is later required.
- **Invariants:** category must belong to the business/current catalog context; appointment snapshots identifying display fields.
- **Deletion/retention:** customer may archive/remove from garage; historical appointments retain snapshots, sensitive identifiers follow retention policy.

### VehicleCategory

- **Ownership:** business.
- **Important fields:** name, description/examples, size/order, compatibility attributes, active/effective status.
- **Relationships:** referenced by vehicles, packages, add-ons, pricing and duration rules.
- **Invariants:** stable ID; unique active name/order as configured; cannot silently reclassify historical quotes.
- **Deletion/retention:** archive; retain references and snapshots.

### ServiceMenu

- **Ownership:** business; optionally scoped to location/mode.
- **Important fields:** name, status (`draft`, `published`, `retired`), version, effective interval, currency, publication metadata.
- **Relationships:** contains service groups; rules/packages attach to a menu/version.
- **Invariants:** at most one applicable published version for a location/mode/time unless precedence is explicit; published versions are immutable.
- **Deletion/retention:** delete unused drafts; retire published versions and retain for history.

### ServiceGroup

- **Ownership:** service menu; optional parent group for nesting.
- **Important fields:** parent ID, name, description, sort order, visibility.
- **Relationships:** contains child groups and packages.
- **Invariants:** acyclic tree, bounded depth, same-menu parent, deterministic order.
- **Deletion/retention:** draft deletion allowed; published groups retire with menu/version.

### ServicePackage

- **Ownership:** service menu/group.
- **Important fields:** name, description/inclusions/exclusions, base price minor units, base duration minutes, fulfillment/vehicle applicability, tax/deposit classes, selection limits, sort/status.
- **Relationships:** compatible add-ons; pricing rules; appointment items snapshot selected package.
- **Invariants:** nonnegative price/duration; valid applicability; published content immutable within version.
- **Deletion/retention:** archive/version; never mutate appointment history.

### AddOn

- **Ownership:** service menu; linked to packages/groups.
- **Important fields:** name, description, base price/duration delta, min/max quantity, option/tier definition, applicability, tax class, status.
- **Relationships:** package compatibility and pricing rules; appointment item snapshots.
- **Invariants:** selection/quantity/tier valid and deterministic; deltas use integer money/minutes.
- **Deletion/retention:** archive/version; preserve snapshots.

### PricingRule

- **Ownership:** business and menu/version.
- **Important fields:** rule type, priority, conditions, integer amount/percentage basis points, duration delta, tax/fee/deposit behavior, effective interval, version.
- **Relationships:** targets packages, add-ons, vehicle categories, modes, locations, areas, coupons, or memberships.
- **Invariants:** deterministic ordering and stacking; compatible currency; percentages represented as integers; applied rules explainable.
- **Deletion/retention:** immutable once published; expire and retain IDs/serialized outcome in quotes/appointments.

### AvailabilityRule

- **Ownership:** business; scoped to location, fulfillment mode, staff/resource/capacity pool.
- **Important fields:** recurrence, local start/end, IANA timezone, effective dates, capacity, service constraints, lead time/buffer/slot interval overrides.
- **Relationships:** combined with time off, appointments, and holds.
- **Invariants:** valid local intervals/recurrence; explicit DST interpretation; nonnegative capacity/buffers.
- **Deletion/retention:** archive/expire; retain enough version metadata to diagnose past slots.

### TimeOffOrBlackout

- **Ownership:** business; scoped to location, staff/resource, or business-wide.
- **Important fields:** UTC interval, original timezone/local context, reason/category, capacity reduction, recurrence if supported.
- **Relationships:** subtracts from availability.
- **Invariants:** end after start; scope belongs to business; capacity reduction valid.
- **Deletion/retention:** cancellation/archival preferred; retain operational history for a defined period.

### Appointment

- **Ownership:** business; linked to location/customer/vehicle.
- **Important fields:** public reference, status, fulfillment mode, UTC start/end, timezone snapshot, address/shop snapshot, contact/vehicle snapshots, notes/site answers, currency, subtotal/discount/tax/fees/deposit/paid/due/total minor units, quote/menu versions, idempotency key, optimistic version.
- **Relationships:** items, status history, payments/refunds, assets, notifications, staff assignments, coupon/gift-card applications, originating hold.
- **Invariants:** monetary equation balances; end after start; status transition valid; confirmed constrained resources do not overlap beyond capacity; totals are server-authored and historical snapshots immutable.
- **Deletion/retention:** never hard-delete normal financial appointments; cancel then retain/anonymize according to policy.

### AppointmentItem

- **Ownership:** appointment.
- **Important fields:** source type/ID/version, display name/description snapshot, quantity/tier, unit/subtotal/discount/tax/total minor units, duration minutes, applied rule snapshot, sort order.
- **Relationships:** points back to catalog source for audit but renders from snapshot.
- **Invariants:** currency matches appointment; quantities/amount equation valid; immutable after financial confirmation except through auditable adjustment/credit records.
- **Deletion/retention:** retained with appointment.

### AppointmentStatusHistory

- **Ownership:** appointment/business.
- **Important fields:** from/to status, occurred-at UTC, actor type/ID, reason code/note, source/event ID.
- **Relationships:** append-only timeline for appointment.
- **Invariants:** ordered event, valid transition, idempotent source key.
- **Deletion/retention:** append-only and retained with appointment; redact unsafe free text if necessary.

### SlotHold

- **Ownership:** business/location; associated with booking attempt and optional user/customer.
- **Important fields:** token hash, UTC interval, timezone snapshot, resource/capacity claims, status, expires-at, idempotency key, quote fingerprint.
- **Relationships:** may convert to one appointment.
- **Invariants:** active iff status active and expiry in future; same key returns same hold; capacity protected transactionally; one conversion maximum.
- **Deletion/retention:** expired rows cleaned after a short diagnostic window; conversion link retained where useful.

### Coupon

- **Ownership:** business.
- **Important fields:** code hash/normalized code, discount rule, currency, usage limits, eligibility/stacking, effective interval, status.
- **Relationships:** redemptions/applications link customer and appointment.
- **Invariants:** server-side atomic usage count; deterministic stacking; no negative totals.
- **Deletion/retention:** disable/expire; retain redemption and appointment snapshot.

### GiftCard

- **Ownership:** issuing business; optional customer owner.
- **Important fields:** secure code hash plus display suffix, currency, issued/remaining minor units, status, expiry where lawful, purchaser/recipient metadata.
- **Relationships:** append-only ledger entries and appointment/payment applications.
- **Invariants:** balance equals ledger; atomic non-overdraw; currency fixed; codes never logged plaintext.
- **Deletion/retention:** financial ledger retained; deactivate compromised cards, anonymize personal data where allowed.

### Membership

- **Ownership:** business/customer.
- **Important fields:** plan/version, status, provider subscription ID, start/renew/end dates, benefit counters, currency/price snapshot.
- **Relationships:** pricing/eligibility benefits, payments, appointments.
- **Invariants:** provider and internal state reconciled; benefits consumed atomically and reversibly according to policy.
- **Deletion/retention:** cancel/end rather than delete; retain billing and benefit history.

### Payment

- **Ownership:** business; linked to appointment/customer and external provider account.
- **Important fields:** purpose, amount/currency, status, provider/payment-intent/charge IDs, idempotency key, safe method summary, authorized/captured/failed timestamps, failure category.
- **Relationships:** refunds, appointment balance, webhook/provider-event records.
- **Invariants:** unique provider IDs and idempotency key per scope; monotonic valid transitions; amount matches approved operation; no raw card data.
- **Deletion/retention:** retain per accounting/dispute rules; redact unnecessary customer metadata.

### Refund

- **Ownership:** business/payment.
- **Important fields:** amount/currency, reason, status, provider refund ID, idempotency key, initiator, timestamps.
- **Relationships:** reduces refundable/captured balance; audit event.
- **Invariants:** aggregate successful refunds do not exceed refundable payment amount; transitions and commands idempotent.
- **Deletion/retention:** append/retain as financial record; failures remain visible.

### UploadedAsset

- **Ownership:** business; linked to appointment/customer/vehicle or configuration and uploader.
- **Important fields:** purpose, storage key, original safe display name, declared/detected type, bytes, checksum, width/height, status, scan result, retention/delete timestamps.
- **Relationships:** attachment join(s) to authorized aggregate.
- **Invariants:** randomized business-scoped key; allowed type/size/purpose; private until validated; access checked through owning aggregate.
- **Deletion/retention:** pending/orphan expiry; purpose-specific retention; hard-delete storage object after legal/backup window and tombstone metadata as required.

### Notification

- **Ownership:** business; linked to recipient/customer and source aggregate.
- **Important fields:** channel, transactional/marketing purpose, destination hash/safe suffix, template/version, locale, payload reference/snapshot, consent basis, status, attempts, provider ID, scheduled/sent/delivered timestamps, error category, idempotency key.
- **Relationships:** generated from outbox/domain event; provider callbacks.
- **Invariants:** unique logical-send key; marketing requires consent; secrets/full sensitive payload absent from logs.
- **Deletion/retention:** body/personal destination expire earlier than aggregate delivery evidence; retain minimum compliance record.

### AuditEvent

- **Ownership:** business (or system/global security scope).
- **Important fields:** UTC occurred-at, actor type/ID, action, target type/ID, request/correlation ID, source IP/user-agent policy fields, safe before/after/change metadata, outcome.
- **Relationships:** references but does not depend on mutable target existence.
- **Invariants:** append-only, integrity-protected, authorized access, sensitive values redacted; timestamps/actor/source trustworthy.
- **Deletion/retention:** long-lived per security/legal policy; pseudonymize actor personal data where compatible, restrict exports.

## Supporting records likely required

Implementation will also need business membership/role assignments, staff-location assignments, appointment-staff assignments, quote/booking attempts, provider webhook inbox events, transactional outbox jobs, gift-card ledger entries, coupon redemptions, payment-method references, membership-plan versions, and schema migration metadata. These are supporting records rather than omitted domain concepts.

## Critical invariants across entities

1. A record never references an entity from another business.
2. Published catalog/rule versions and confirmed appointment snapshots are historical facts.
3. `subtotal - discounts + tax + fees = total`; applied gift card/payment amounts are separate tender and never silently rewrite the sale total.
4. Every money operation has currency and an idempotency identity; successful refunds cannot exceed captured refundable funds.
5. Every schedule instant is UTC and every local interpretation names an IANA timezone; confirmed capacity cannot exceed configured limits.
6. Client estimates, slot displays, roles, and payment redirects never override server authority.
