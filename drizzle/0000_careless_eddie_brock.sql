CREATE TYPE "public"."record_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"default_currency" text DEFAULT 'USD' NOT NULL,
	"default_locale" text DEFAULT 'en-US' NOT NULL,
	"default_timezone" text DEFAULT 'America/Chicago' NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_currency_iso_length" CHECK (char_length("businesses"."default_currency") = 3)
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_unique" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_business_name_unique" ON "locations" USING btree ("business_id","name");--> statement-breakpoint
CREATE INDEX "locations_business_status_idx" ON "locations" USING btree ("business_id","status");