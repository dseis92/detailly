import { createHash, randomBytes } from "node:crypto";

export type HoldStatus = "active" | "converted" | "released" | "expired";

export interface SlotHold {
  readonly id: string;
  readonly tokenHash: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly expiresAt: Date;
  readonly status: HoldStatus;
  readonly idempotencyKey: string;
}

export interface CreateHoldInput {
  readonly now: Date;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly idempotencyKey: string;
  readonly holdDurationMinutes?: number;
}

export interface CreatedHold {
  readonly hold: SlotHold;
  /** Returned once; persist only the hash and show the token to the caller. */
  readonly token: string;
}

export function createSlotHold(input: CreateHoldInput): CreatedHold {
  const holdDurationMinutes = input.holdDurationMinutes ?? 15;
  if (!input.idempotencyKey.trim())
    throw new Error("Idempotency key is required.");
  if (holdDurationMinutes < 1 || holdDurationMinutes > 30)
    throw new Error("Hold duration must be between 1 and 30 minutes.");
  if (input.startsAt <= input.now)
    throw new Error("Slot must start in the future.");
  if (input.endsAt <= input.startsAt)
    throw new Error("Slot end must follow its start.");
  if (input.endsAt.getTime() - input.startsAt.getTime() > 8 * 60 * 60_000)
    throw new Error("Slot duration cannot exceed 8 hours.");

  const token = randomBytes(24).toString("base64url");
  return {
    token,
    hold: {
      id: randomBytes(16).toString("hex"),
      tokenHash: hashHoldToken(token),
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      expiresAt: new Date(input.now.getTime() + holdDurationMinutes * 60_000),
      status: "active",
      idempotencyKey: input.idempotencyKey
    }
  };
}

export function hashHoldToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isHoldActive(hold: SlotHold, now: Date): boolean {
  return hold.status === "active" && hold.expiresAt > now;
}

export function expireHold(hold: SlotHold, now: Date): SlotHold {
  if (hold.status !== "active" || hold.expiresAt > now) return hold;
  return { ...hold, status: "expired" };
}
