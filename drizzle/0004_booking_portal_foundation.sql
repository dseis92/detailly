CREATE TYPE "public"."appointment_status" AS ENUM('request_received', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "appointment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"package_id" text NOT NULL,
	"display_name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_amount_minor" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"inclusions" jsonb NOT NULL,
	"sort_order" integer NOT NULL,
	CONSTRAINT "appointment_items_quantity_positive" CHECK ("appointment_items"."quantity" > 0),
	CONSTRAINT "appointment_items_amount_nonnegative" CHECK ("appointment_items"."unit_amount_minor" >= 0),
	CONSTRAINT "appointment_items_duration_nonnegative" CHECK ("appointment_items"."duration_minutes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_reference" text NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "appointment_status" DEFAULT 'request_received' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"service_ends_at" timestamp with time zone NOT NULL,
	"blocked_until" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	"service_address" text NOT NULL,
	"vehicle_description" text NOT NULL,
	"vehicle_category" text NOT NULL,
	"water_available" boolean NOT NULL,
	"electricity_available" boolean NOT NULL,
	"condition_notes" text DEFAULT '' NOT NULL,
	"access_notes" text DEFAULT '' NOT NULL,
	"referral_source" text NOT NULL,
	"subtotal_minor" integer NOT NULL,
	"discount_minor" integer NOT NULL,
	"tax_minor" integer NOT NULL,
	"total_minor" integer NOT NULL,
	"deposit_minor" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_interval_order" CHECK ("appointments"."service_ends_at" > "appointments"."starts_at" AND "appointments"."blocked_until" >= "appointments"."service_ends_at"),
	CONSTRAINT "appointments_amounts_nonnegative" CHECK ("appointments"."subtotal_minor" >= 0 AND "appointments"."discount_minor" >= 0 AND "appointments"."tax_minor" >= 0 AND "appointments"."total_minor" >= 0 AND "appointments"."deposit_minor" >= 0)
);
--> statement-breakpoint
ALTER TABLE "appointment_items" ADD CONSTRAINT "appointment_items_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_items_appointment_idx" ON "appointment_items" USING btree ("appointment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_public_reference_unique" ON "appointments" USING btree ("public_reference");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_idempotency_unique" ON "appointments" USING btree ("business_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "appointments_business_start_idx" ON "appointments" USING btree ("business_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointments_customer_created_idx" ON "appointments" USING btree ("customer_id","created_at");
--> statement-breakpoint
INSERT INTO "businesses" ("display_name", "slug")
VALUES ('Detailly Mobile Detailing', 'detailly')
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "business_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointment_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON "users", "business_memberships", "customers", "sessions", "staff_members", "audit_events", "appointments", "appointment_items" FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON "users", "business_memberships", "customers", "sessions", "staff_members", "audit_events", "appointments", "appointment_items" FROM authenticated';
  END IF;
END $$;
