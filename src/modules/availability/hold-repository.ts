import { and, eq, gt, lt, sql } from "drizzle-orm";
import { getDatabase } from "@/infrastructure/database/client";
import { slotHolds } from "@/infrastructure/database/schema";
import { createSlotHold, type SlotHold } from "./holds";

export interface ReserveSlotHoldInput {
  readonly businessId: string;
  readonly locationId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly idempotencyKey: string;
  readonly now?: Date;
  readonly capacity?: number;
}

export interface ReservedSlotHold {
  readonly hold: SlotHold;
  readonly token: string | null;
  readonly reused: boolean;
}

/**
 * Reserves a slot under a transaction-scoped advisory lock. The lock keeps
 * parallel requests for the same location/window from exceeding capacity.
 */
export async function reserveSlotHold(
  input: ReserveSlotHoldInput
): Promise<ReservedSlotHold> {
  const now = input.now ?? new Date();
  const capacity = input.capacity ?? 1;
  if (capacity < 1) throw new Error("Capacity must be positive.");
  const candidate = createSlotHold({
    now,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    idempotencyKey: input.idempotencyKey
  });
  const database = getDatabase();

  return database.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`${input.locationId}:${input.startsAt.toISOString()}:${input.endsAt.toISOString()}`}))`
    );

    const existing = await tx
      .select()
      .from(slotHolds)
      .where(
        and(
          eq(slotHolds.locationId, input.locationId),
          eq(slotHolds.idempotencyKey, input.idempotencyKey)
        )
      )
      .limit(1);
    const existingRow = existing[0];
    if (existingRow) {
      return { hold: toDomainHold(existingRow), token: null, reused: true };
    }

    const active = await tx
      .select({ id: slotHolds.id })
      .from(slotHolds)
      .where(
        and(
          eq(slotHolds.locationId, input.locationId),
          eq(slotHolds.status, "active"),
          gt(slotHolds.expiresAt, now),
          lt(slotHolds.startsAt, input.endsAt),
          gt(slotHolds.endsAt, input.startsAt)
        )
      );
    if (active.length >= capacity)
      throw new Error("This appointment window is no longer available.");

    const inserted = await tx
      .insert(slotHolds)
      .values({
        businessId: input.businessId,
        locationId: input.locationId,
        tokenHash: candidate.hold.tokenHash,
        startsAt: candidate.hold.startsAt,
        endsAt: candidate.hold.endsAt,
        expiresAt: candidate.hold.expiresAt,
        status: candidate.hold.status,
        idempotencyKey: candidate.hold.idempotencyKey,
        createdAt: now
      })
      .returning();
    const row = inserted[0];
    if (!row) throw new Error("Slot hold could not be created.");
    return { hold: toDomainHold(row), token: candidate.token, reused: false };
  });
}

function toDomainHold(row: typeof slotHolds.$inferSelect): SlotHold {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    expiresAt: row.expiresAt,
    status: row.status,
    idempotencyKey: row.idempotencyKey
  };
}
