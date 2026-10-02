import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const recordStatus = pgEnum("record_status", ["active", "inactive"]);

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
