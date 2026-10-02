import { getDatabase } from "@/infrastructure/database/client";
import { auditEvents } from "@/infrastructure/database/schema";
import { redactAuditMetadata } from "@/modules/identity-access/policy";

export interface AuditInput {
  readonly businessId: string;
  readonly actorUserId?: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId?: string;
  readonly requestId?: string;
  readonly metadata?: Record<string, string | number | boolean | null>;
}

export async function recordAuditEvent(input: AuditInput): Promise<void> {
  await getDatabase()
    .insert(auditEvents)
    .values({
      businessId: input.businessId,
      actorUserId: input.actorUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      requestId: input.requestId,
      metadata: redactAuditMetadata(input.metadata ?? {})
    });
}
