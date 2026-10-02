export const roles = ["customer", "staff", "manager", "owner"] as const;
export type Role = (typeof roles)[number];

export type Capability =
  | "view_customer_portal"
  | "view_operations"
  | "manage_locations"
  | "manage_staff"
  | "manage_business";

export interface Actor {
  readonly userId: string;
  readonly businessId: string;
  readonly role: Role;
  readonly displayName: string;
  readonly email: string;
}

const capabilityRoles: Record<Capability, readonly Role[]> = {
  view_customer_portal: ["customer", "staff", "manager", "owner"],
  view_operations: ["staff", "manager", "owner"],
  manage_locations: ["manager", "owner"],
  manage_staff: ["manager", "owner"],
  manage_business: ["owner"]
};

export function can(
  actor: Actor | null,
  capability: Capability,
  businessId: string
): boolean {
  return (
    actor?.businessId === businessId &&
    capabilityRoles[capability].includes(actor.role)
  );
}

export function requireCapability(
  actor: Actor | null,
  capability: Capability,
  businessId: string
): Actor {
  if (actor === null || !can(actor, capability, businessId)) {
    throw new AuthorizationError(
      "You do not have permission for this business operation."
    );
  }
  return actor;
}

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function redactAuditMetadata(
  input: Record<string, string | number | boolean | null>
): Record<string, string | number | boolean | null> {
  const sensitive =
    /(token|secret|password|client.?secret|authorization|cookie|card|cvc)/i;
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      sensitive.test(key) ? "[REDACTED]" : value
    ])
  );
}
