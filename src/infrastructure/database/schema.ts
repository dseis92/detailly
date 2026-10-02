import {
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const recordStatus = pgEnum("record_status", ["active", "inactive"]);
export const userStatus = pgEnum("user_status", [
  "active",
  "suspended",
  "deleted"
]);
export const memberRole = pgEnum("member_role", [
  "customer",
  "staff",
  "manager",
  "owner"
]);

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    displayName: text("display_name").notNull(),
    slug: text("slug").notNull(),
    defaultCurrency: text("default_currency").notNull().default("USD"),
    defaultLocale: text("default_locale").notNull().default("en-US"),
    defaultTimezone: text("default_timezone")
      .notNull()
      .default("America/Chicago"),
    status: recordStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("businesses_slug_unique").on(table.slug),
    check(
      "businesses_currency_iso_length",
      sql`char_length(${table.defaultCurrency}) = 3`
    )
  ]
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    timezone: text("timezone").notNull(),
    status: recordStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("locations_business_name_unique").on(
      table.businessId,
      table.name
    ),
    index("locations_business_status_idx").on(table.businessId, table.status)
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    status: userStatus("status").notNull().default("active"),
    emailVerifiedAt: timestamp("email_verified_at", {
      withTimezone: true,
      mode: "date"
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
);

export const businessMemberships = pgTable(
  "business_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: memberRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("business_memberships_business_user_unique").on(
      table.businessId,
      table.userId
    ),
    index("business_memberships_user_idx").on(table.userId)
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    lastRotatedAt: timestamp("last_rotated_at", {
      withTimezone: true,
      mode: "date"
    })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_idx").on(table.userId),
    check(
      "sessions_expiry_after_creation",
      sql`${table.expiresAt} > ${table.createdAt}`
    )
  ]
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    displayName: text("display_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("customers_business_user_unique").on(
      table.businessId,
      table.userId
    ),
    index("customers_business_email_idx").on(table.businessId, table.email)
  ]
);

export const staffMembers = pgTable(
  "staff_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    displayName: text("display_name").notNull(),
    status: recordStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("staff_members_business_user_unique").on(
      table.businessId,
      table.userId
    )
  ]
);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null"
    }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id"),
    requestId: text("request_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull()
      .default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index("audit_events_business_occurred_idx").on(
      table.businessId,
      table.occurredAt
    )
  ]
);
