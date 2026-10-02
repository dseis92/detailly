CREATE TYPE "public"."menu_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TABLE "service_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"parent_group_id" uuid,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "menu_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "service_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"vehicle_category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"inclusions" jsonb NOT NULL,
	"original_price_minor" integer NOT NULL,
	"promotional_price_minor" integer NOT NULL,
	"discount_basis_points" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_packages_original_positive" CHECK ("service_packages"."original_price_minor" > 0),
	CONSTRAINT "service_packages_promotional_positive" CHECK ("service_packages"."promotional_price_minor" > 0),
	CONSTRAINT "service_packages_promotional_not_above_original" CHECK ("service_packages"."promotional_price_minor" <= "service_packages"."original_price_minor"),
	CONSTRAINT "service_packages_duration_positive" CHECK ("service_packages"."duration_minutes" > 0),
	CONSTRAINT "service_packages_discount_range" CHECK ("service_packages"."discount_basis_points" >= 0 AND "service_packages"."discount_basis_points" < 10000)
);
--> statement-breakpoint
CREATE TABLE "vehicle_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "record_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_groups" ADD CONSTRAINT "service_groups_menu_id_service_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."service_menus"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_menus" ADD CONSTRAINT "service_menus_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_group_id_service_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."service_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_vehicle_category_id_vehicle_categories_id_fk" FOREIGN KEY ("vehicle_category_id") REFERENCES "public"."vehicle_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_categories" ADD CONSTRAINT "vehicle_categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_groups_menu_parent_idx" ON "service_groups" USING btree ("menu_id","parent_group_id");--> statement-breakpoint
CREATE INDEX "service_menus_business_status_idx" ON "service_menus" USING btree ("business_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "service_packages_group_vehicle_name_unique" ON "service_packages" USING btree ("group_id","vehicle_category_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_categories_business_name_unique" ON "vehicle_categories" USING btree ("business_id","name");