# Phase 0 stack and provider research

Accessed **2026-10-01**. Sources are first-party product documentation. This memo recommends capabilities and integration boundaries; dependency versions must be selected from the package registry during implementation and locked in the repository rather than inferred here. The initial Auth.js/provider-neutral database recommendation was updated by the owner on 2026-10-03; see [ADR 0001](docs/decisions/0001-supabase-auth-and-postgres.md).

## Decision summary

Use a **strict-TypeScript Next.js App Router modular monolith**, deployed to **Vercel**, backed by **Supabase PostgreSQL/Auth** and **Drizzle ORM/Kit**. Use **Supabase Auth** for verified email-link sessions, **Stripe PaymentIntents** for required prepayment, **Google Maps Platform Places Autocomplete (New)** for address entry, an **S3-compatible object store** through a narrow presigned-upload adapter, **Resend** for transactional email, **Twilio Messaging** for SMS, and **Playwright Test** for critical browser journeys. Keep every vendor behind an application-owned interface so providers can be substituted without changing booking, pricing, scheduling, or payment-domain rules.

## Framework: Next.js + TypeScript

**Recommendation:** Next.js App Router with strict TypeScript. Keep rendering, route handlers, and server actions in the web layer; keep pricing, availability, booking, and payment orchestration in framework-independent domain/application modules. Prefer the Node.js runtime for database and provider integrations unless an Edge requirement is demonstrated.

**Why:** App Router provides Server and Client Components and file-based routing; Next.js has built-in TypeScript support. A Node.js or Docker deployment supports all Next.js features, while static export is limited. Next.js also exposes an `instrumentation.ts` convention for OpenTelemetry and server error capture. ([App Router](https://nextjs.org/docs/app), [TypeScript](https://nextjs.org/docs/app/api-reference/config/typescript), [deployment options](https://nextjs.org/docs/app/getting-started/deploying), [instrumentation](https://nextjs.org/docs/app/guides/instrumentation))

**Tradeoff:** App Router caching and server/client boundaries add conceptual overhead. Make dynamic booking and account reads explicit and test production builds; follow the official production checklist rather than assuming development behavior. ([production checklist](https://nextjs.org/docs/app/guides/production-checklist))

## Data: PostgreSQL + Drizzle

**Recommendation:** Managed PostgreSQL with Drizzle ORM/Kit. Commit generated SQL migrations and apply them as a separate release step; use `drizzle-kit push` only for disposable development databases. Use database constraints plus transactions for booking invariants, and PostgreSQL-native range/exclusion or locking techniques where necessary to prevent overlaps.

**Why:** PostgreSQL supplies transactions and strong relational constraints for appointments, slot holds, payment records, and audit history. Drizzle keeps schema declarations in TypeScript, exposes SQL directly, generates reviewable SQL migrations, and supports transactions and nested savepoints. ([PostgreSQL transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html), [Drizzle schema](https://orm.drizzle.team/docs/sql-schema-declaration), [migration generation](https://orm.drizzle.team/docs/drizzle-kit-generate), [transactions](https://orm.drizzle.team/docs/transactions))

**Drizzle vs Prisma:** Choose Drizzle because this system needs explicit SQL-level scheduling constraints and auditable migrations, and the smaller abstraction gap is valuable. Prisma remains reasonable when higher-level generated CRUD ergonomics and its schema/client workflow matter more; its official docs support PostgreSQL, migrations, and transactions. The cost of Drizzle is more SQL knowledge and less abstraction. Do not mix both ORMs. ([Prisma supported databases](https://www.prisma.io/docs/orm/reference/supported-databases), [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate), [Prisma transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions))

## Authentication and authorization

**Selected provider:** Supabase Auth for browser authentication and session lifecycle, with cookie sessions through `@supabase/ssr`. Allow guest checkout separately. Store application roles and business membership in owned tables and enforce authorization server-side on every protected operation. The earlier Auth.js comparison below is retained as the provider research that preceded the owner's selection.

Auth.js supports Next.js integration, database adapters, OAuth providers, and database or JWT session strategies. Authentication proves identity; it does not replace application authorization. Use secure cookies, CSRF protections supplied by the framework/library, short-lived sessions appropriate to the role, and explicit account-linking policy. ([Auth.js Next.js guide](https://authjs.dev/getting-started/installation?framework=next-js), [session strategies](https://authjs.dev/concepts/session-strategies), [Drizzle adapter](https://authjs.dev/getting-started/adapters/drizzle))

**Tradeoff:** Auth.js minimizes custom credential handling but still requires schema ownership, provider configuration, transactional email, and careful RBAC. Avoid passwords in the MVP unless the business explicitly requires them and the operational burden is accepted.

## Payments: Stripe PaymentIntents and webhooks

**Recommendation:** Create exactly one PaymentIntent per booking payment attempt/order context, record its ID on the local payment record, and create/update it server-side using a stable idempotency key derived from the internal operation—not user input. The browser may confirm payment with Stripe's client secret, but the server must finalize paid state from verified webhooks.

Stripe recommends one PaymentIntent per order or customer session; a PaymentIntent tracks attempts and produces at most one successful charge. Stripe supports idempotency keys on POST requests and rejects reuse with different parameters. ([PaymentIntents](https://docs.stripe.com/api/payment_intents), [idempotent requests](https://docs.stripe.com/api/idempotent_requests))

Webhook handling must verify the signature against the **raw request body**, return success quickly, enqueue or persist processing, and deduplicate by Stripe event ID. Do not assume event order; retrieve the current Stripe object or reconcile from stored state when necessary. Webhook endpoints can receive duplicate events and delivery order is not guaranteed. ([webhook signatures](https://docs.stripe.com/webhooks/signature), [webhook best practices](https://docs.stripe.com/webhooks#best-practices))

Model refunds separately, keep amounts in integer minor units, never trust browser-calculated totals, and never log a PaymentIntent client secret. Decide later whether deposits use automatic capture or separate authorization/capture; authorization windows and cancellation behavior must be validated against the chosen payment method before launch.

## Address autocomplete and maps

**Recommendation:** Use Google Maps JavaScript API with **Places Autocomplete (New)** for the address-first UI, then fetch only required fields (place ID, formatted address, address components, and location). Generate a fresh session token per autocomplete interaction and complete it with Place Details (New). Store the provider place ID plus normalized address and coordinates; treat the business's service-area decision as server-authoritative.

Google documents that session tokens group autocomplete and selection for billing, should be unique per session, and conclude with Place Details or Address Validation. Field masks avoid unnecessary data and cost. Predictions displayed without a map require Google attribution. ([Autocomplete (New)](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete), [session tokens](https://developers.google.com/maps/documentation/places/web-service/using-session-tokens), [Maps JavaScript loading](https://developers.google.com/maps/documentation/javascript/load-maps-js-api))

**Security/tradeoff:** Restrict browser keys by allowed web origins and API; use separate server credentials where needed and apply quotas/budgets. Google data use, caching, and attribution are constrained by Maps Platform terms. A vendor-neutral address interface is worthwhile, but the visual map and Places data cannot be treated as freely portable. ([API security best practices](https://developers.google.com/maps/api-security-best-practices), [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies))

## Photo uploads: S3-compatible object storage

**Recommendation:** Define an `ObjectStorage` interface and use short-lived presigned PUT or POST uploads. The server generates an unguessable, business-scoped object key after authenticating/authorizing the request and validating declared MIME type and size; the browser uploads directly; the server then verifies object metadata before attaching an `UploadedAsset` record.

AWS documents that presigned URLs grant time-limited upload/download access using the signer’s permissions, and that uploading to an existing key replaces the object. Use unique keys, least-privilege credentials, private buckets, explicit content/size controls, lifecycle rules, and CORS restricted to application origins. Do not accept a client-supplied final object key. ([presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html), [presigned POST conditions](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html), [CORS](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html))

**Tradeoff:** “S3-compatible” implementations differ at the edges. Keep the adapter limited to presign, head, delete, and read URL operations, and run contract tests against the selected provider before launch. Malware scanning can be an asynchronous later-stage requirement; uploaded files must not be made public by default.

## Notifications

### Email: Resend

**Recommendation:** Resend for transactional email through an `EmailSender` interface. Send only after persisting a notification/outbox record; use an idempotency key per logical notification, record the provider message ID, and consume verified webhooks for delivery state. Resend supports idempotency keys and recommends webhook signature verification. ([send email](https://resend.com/docs/api-reference/emails/send-email), [idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys), [verify webhooks](https://resend.com/docs/dashboard/webhooks/verify-webhooks-requests))

Set up SPF/DKIM on a dedicated sending subdomain and keep templates/versioning in source control. Email acceptance is not delivery; booking state must never depend on notification success.

### SMS: Twilio Messaging

**Recommendation:** Twilio Messaging through an `SmsSender` interface, initially for transactional confirmations/reminders only. Normalize recipients to E.164, store consent and opt-out state, use a Messaging Service when moving beyond a prototype, and verify callback signatures using Twilio’s SDK. Track message SID and status callbacks; `sent` is not the same as `delivered`. ([Message resource and callbacks](https://www.twilio.com/docs/messaging/api/message-resource), [webhook security](https://www.twilio.com/docs/usage/webhooks/webhooks-security), [Messaging Services](https://www.twilio.com/docs/messaging/services))

**Tradeoff:** SMS introduces country-specific registration, consent, quiet-hour, content, and opt-out requirements as well as segment-based cost. Keep it feature-flagged until the business supplies notification preferences and legal/compliance requirements.

## Testing

**Recommendation:** Use unit tests for pure pricing/duration/availability rules, integration tests against PostgreSQL for constraints and transactions, provider contract tests at adapter boundaries, and Playwright Test for the smallest set of revenue-critical browser flows: address/service area, service configuration, slot hold, guest/auth checkout, payment outcomes, and portal authorization.

Playwright Test includes TypeScript support, isolated browser contexts, multiple browser projects, retries, tracing, and auto-retrying web-first assertions. Prefer accessible role/label locators and deterministic provider fakes in CI; keep a separate, opt-in sandbox smoke suite for real provider test modes. ([Playwright Test](https://playwright.dev/docs/intro), [best practices](https://playwright.dev/docs/best-practices), [assertions](https://playwright.dev/docs/test-assertions), [trace viewer](https://playwright.dev/docs/trace-viewer))

## Deployment and observability

**Recommendation:** Deploy the Next.js application to Vercel and use a managed PostgreSQL provider with connection pooling appropriate to serverless workloads. Run schema migrations as an explicit, single-writer release job before promoting code that depends on them; use backward-compatible expand/migrate/contract changes. Use separate preview/staging/production credentials and never allow preview deployments to mutate production providers.

Vercel provides Git-based deployments, function logs, and an Observability view. Next.js instrumentation supports OpenTelemetry registration and request error capture, keeping telemetry portable. ([Vercel deployments](https://vercel.com/docs/deployments/overview), [Vercel Observability](https://vercel.com/docs/observability), [Vercel logs](https://vercel.com/docs/logs), [Next.js OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry))

Emit structured logs with request/booking/payment correlation IDs; redact secrets, session tokens, payment client secrets, message bodies, and sensitive customer data. Monitor error rate, route latency, database saturation, booking conversion, slot-conflict rate, webhook backlog/failures, payment reconciliation mismatches, and notification failures. Configure alerts only after defining owners and runbooks. Consider Sentry or another vendor later; OpenTelemetry plus platform logs is sufficient for Phase 0 and avoids premature provider lock-in.

## Phase 0 implications

- Add foundational framework/test dependencies in Phase 1; in Phase 0, document provider environment variables and defer every provider SDK until its implementation phase.
- Define interfaces for clock, ID generation, database transactions, payments, maps/geocoding, object storage, email, and SMS.
- Persist idempotency keys, external IDs, webhook/event receipts, attempts, and error state in the data model.
- Make totals, availability, service-area eligibility, and appointment state transitions server-authoritative.
- Treat every webhook/callback as authenticated but still untrusted input; verify, validate, deduplicate, and process transactionally.
- Revisit pricing, data residency/retention, messaging compliance, tax, cancellation/refund, deposit/capture, and service-area policy before enabling production providers.
