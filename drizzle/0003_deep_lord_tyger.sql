CREATE TYPE "public"."hold_status" AS ENUM('active', 'converted', 'released', 'expired');--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_local" text NOT NULL,
	"end_local" text NOT NULL,
	"timezone" text NOT NULL,
	"slot_interval_minutes" integer DEFAULT 30 NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_until" timestamp with time zone,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_rules_weekday_range" CHECK ("availability_rules"."weekday" >= 0 AND "availability_rules"."weekday" <= 6),
	CONSTRAINT "availability_rules_capacity_positive" CHECK ("availability_rules"."capacity" > 0),
	CONSTRAINT "availability_rules_interval_positive" CHECK ("availability_rules"."slot_interval_minutes" > 0),
	CONSTRAINT "availability_rules_effective_order" CHECK ("availability_rules"."effective_until" IS NULL OR "availability_rules"."effective_from" IS NULL OR "availability_rules"."effective_until" > "availability_rules"."effective_from")
);
--> statement-breakpoint
CREATE TABLE "slot_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "hold_status" DEFAULT 'active' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slot_holds_order" CHECK ("slot_holds"."ends_at" > "slot_holds"."starts_at"),
	CONSTRAINT "slot_holds_expiry_after_start" CHECK ("slot_holds"."expires_at" > "slot_holds"."created_at")
);
--> statement-breakpoint
CREATE TABLE "time_off_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "time_off_blocks_order" CHECK ("time_off_blocks"."ends_at" > "time_off_blocks"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_holds" ADD CONSTRAINT "slot_holds_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_holds" ADD CONSTRAINT "slot_holds_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_blocks" ADD CONSTRAINT "time_off_blocks_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off_blocks" ADD CONSTRAINT "time_off_blocks_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_rules_location_weekday_idx" ON "availability_rules" USING btree ("location_id","weekday");--> statement-breakpoint
CREATE UNIQUE INDEX "slot_holds_token_hash_unique" ON "slot_holds" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "slot_holds_location_idempotency_unique" ON "slot_holds" USING btree ("location_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "slot_holds_location_interval_idx" ON "slot_holds" USING btree ("location_id","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "time_off_blocks_location_interval_idx" ON "time_off_blocks" USING btree ("location_id","starts_at","ends_at");