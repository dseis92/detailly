import {
  boolean,
  check,
  index,
  integer,
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
export const menuStatus = pgEnum("menu_status", [
  "draft",
  "published",
  "retired"
]);
export const holdStatus = pgEnum("hold_status", [
  "active",
  "converted",
  "released",
  "expired"
]);
export const appointmentStatus = pgEnum("appointment_status", [
  "request_received",
  "confirmed",
  "cancelled",
  "completed"
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

export const vehicleCategories = pgTable(
  "vehicle_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: recordStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("vehicle_categories_business_name_unique").on(
      table.businessId,
      table.name
    )
  ]
);

export const serviceMenus = pgTable(
  "service_menus",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    version: integer("version").notNull().default(1),
    status: menuStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true, mode: "date" })
  },
  (table) => [
    index("service_menus_business_status_idx").on(
      table.businessId,
      table.status
    )
  ]
);

export const serviceGroups = pgTable(
  "service_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => serviceMenus.id, { onDelete: "restrict" }),
    parentGroupId: uuid("parent_group_id"),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index("service_groups_menu_parent_idx").on(
      table.menuId,
      table.parentGroupId
    )
  ]
);

export const servicePackages = pgTable(
  "service_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => serviceGroups.id, { onDelete: "restrict" }),
    vehicleCategoryId: uuid("vehicle_category_id")
      .notNull()
      .references(() => vehicleCategories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description").notNull(),
    inclusions: jsonb("inclusions").$type<string[]>().notNull(),
    originalPriceMinor: integer("original_price_minor").notNull(),
    promotionalPriceMinor: integer("promotional_price_minor").notNull(),
    discountBasisPoints: integer("discount_basis_points").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    status: recordStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("service_packages_group_vehicle_name_unique").on(
      table.groupId,
      table.vehicleCategoryId,
      table.name
    ),
    check(
      "service_packages_original_positive",
      sql`${table.originalPriceMinor} > 0`
    ),
    check(
      "service_packages_promotional_positive",
      sql`${table.promotionalPriceMinor} > 0`
    ),
    check(
      "service_packages_promotional_not_above_original",
      sql`${table.promotionalPriceMinor} <= ${table.originalPriceMinor}`
    ),
    check(
      "service_packages_duration_positive",
      sql`${table.durationMinutes} > 0`
    ),
    check(
      "service_packages_discount_range",
      sql`${table.discountBasisPoints} >= 0 AND ${table.discountBasisPoints} < 10000`
    )
  ]
);

export const availabilityRules = pgTable(
  "availability_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    weekday: integer("weekday").notNull(),
    startLocal: text("start_local").notNull(),
    endLocal: text("end_local").notNull(),
    timezone: text("timezone").notNull(),
    slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(30),
    capacity: integer("capacity").notNull().default(1),
    effectiveFrom: timestamp("effective_from", {
      withTimezone: true,
      mode: "date"
    }),
    effectiveUntil: timestamp("effective_until", {
      withTimezone: true,
      mode: "date"
    }),
    status: recordStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index("availability_rules_location_weekday_idx").on(
      table.locationId,
      table.weekday
    ),
    check(
      "availability_rules_weekday_range",
      sql`${table.weekday} >= 0 AND ${table.weekday} <= 6`
    ),
    check("availability_rules_capacity_positive", sql`${table.capacity} > 0`),
    check(
      "availability_rules_interval_positive",
      sql`${table.slotIntervalMinutes} > 0`
    ),
    check(
      "availability_rules_effective_order",
      sql`${table.effectiveUntil} IS NULL OR ${table.effectiveFrom} IS NULL OR ${table.effectiveUntil} > ${table.effectiveFrom}`
    )
  ]
);

export const timeOffBlocks = pgTable(
  "time_off_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    index("time_off_blocks_location_interval_idx").on(
      table.locationId,
      table.startsAt,
      table.endsAt
    ),
    check("time_off_blocks_order", sql`${table.endsAt} > ${table.startsAt}`)
  ]
);

export const slotHolds = pgTable(
  "slot_holds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull(),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    endsAt: timestamp("ends_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    status: holdStatus("status").notNull().default("active"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("slot_holds_token_hash_unique").on(table.tokenHash),
    uniqueIndex("slot_holds_location_idempotency_unique").on(
      table.locationId,
      table.idempotencyKey
    ),
    index("slot_holds_location_interval_idx").on(
      table.locationId,
      table.startsAt,
      table.endsAt
    ),
    check("slot_holds_order", sql`${table.endsAt} > ${table.startsAt}`),
    check(
      "slot_holds_expiry_after_start",
      sql`${table.expiresAt} > ${table.createdAt}`
    )
  ]
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    publicReference: text("public_reference").notNull(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    status: appointmentStatus("status").notNull().default("request_received"),
    startsAt: timestamp("starts_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    serviceEndsAt: timestamp("service_ends_at", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    blockedUntil: timestamp("blocked_until", {
      withTimezone: true,
      mode: "date"
    }).notNull(),
    timezone: text("timezone").notNull(),
    serviceAddress: text("service_address").notNull(),
    customerAddress: text("customer_address").notNull().default(""),
    vehicleDescription: text("vehicle_description").notNull(),
    vehicleCategory: text("vehicle_category").notNull(),
    waterAvailable: boolean("water_available").notNull(),
    electricityAvailable: boolean("electricity_available").notNull(),
    conditionNotes: text("condition_notes").notNull().default(""),
    accessNotes: text("access_notes").notNull().default(""),
    referralSource: text("referral_source").notNull(),
    subtotalMinor: integer("subtotal_minor").notNull(),
    discountMinor: integer("discount_minor").notNull(),
    taxMinor: integer("tax_minor").notNull(),
    totalMinor: integer("total_minor").notNull(),
    depositMinor: integer("deposit_minor").notNull(),
    currency: text("currency").notNull().default("USD"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex("appointments_public_reference_unique").on(
      table.publicReference
    ),
    uniqueIndex("appointments_idempotency_unique").on(
      table.businessId,
      table.idempotencyKey
    ),
    index("appointments_business_start_idx").on(
      table.businessId,
      table.startsAt
    ),
    index("appointments_customer_created_idx").on(
      table.customerId,
      table.createdAt
    ),
    check(
      "appointments_interval_order",
      sql`${table.serviceEndsAt} > ${table.startsAt} AND ${table.blockedUntil} >= ${table.serviceEndsAt}`
    ),
    check(
      "appointments_amounts_nonnegative",
      sql`${table.subtotalMinor} >= 0 AND ${table.discountMinor} >= 0 AND ${table.taxMinor} >= 0 AND ${table.totalMinor} >= 0 AND ${table.depositMinor} >= 0`
    )
  ]
);

export const appointmentItems = pgTable(
  "appointment_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "restrict" }),
    packageId: text("package_id").notNull(),
    displayName: text("display_name").notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmountMinor: integer("unit_amount_minor").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    inclusions: jsonb("inclusions").$type<string[]>().notNull(),
    sortOrder: integer("sort_order").notNull()
  },
  (table) => [
    index("appointment_items_appointment_idx").on(table.appointmentId),
    check("appointment_items_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "appointment_items_amount_nonnegative",
      sql`${table.unitAmountMinor} >= 0`
    ),
    check(
      "appointment_items_duration_nonnegative",
      sql`${table.durationMinutes} >= 0`
    )
  ]
);
