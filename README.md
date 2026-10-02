# Detailly

Detailly is a mobile-first booking and operations platform for an auto-detailing business. Phase 1 establishes the executable foundation; customer booking features begin in later reviewed phases.

## Local setup

Requirements: Node.js 24, pnpm 11, and Docker.

1. Copy `.env.example` to `.env.local` and use the local database URL below:

   `DATABASE_URL=postgresql://detailly:detailly_local_only@localhost:5432/detailly`

2. Install dependencies with `pnpm install`.
3. Start PostgreSQL with `docker compose up -d postgres`.
4. Apply migrations with `pnpm db:migrate` and verify with `pnpm db:check`.
5. Start the application with `pnpm dev`.

The application is at `http://localhost:3000`; runtime readiness is at `http://localhost:3000/api/health`.

## Validation

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:browser`

`pnpm validate` runs the non-browser checks. Browser tests start the application automatically. Database migration and readiness checks require the local PostgreSQL container.

Product, architectural, data, and phased delivery decisions live in the root Markdown documents. Read `CLAUDE.md` before changing the repository.
