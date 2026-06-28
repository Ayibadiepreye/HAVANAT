CREATE TABLE IF NOT EXISTS "bespoke_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(30) NOT NULL,
	"user_id" integer,
	"customer_name" varchar(200) NOT NULL,
	"customer_email" varchar(200) NOT NULL,
	"customer_phone" varchar(30) DEFAULT '' NOT NULL,
	"occasion" varchar(200) NOT NULL,
	"budget" numeric(12, 2),
	"timeline" varchar(200) DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"measurements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"assigned_to" integer,
	"admin_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bespoke_requests_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(200) NOT NULL,
	"subject" varchar(300) NOT NULL,
	"body" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" integer,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verify_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verify_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_discounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"percent" numeric(5, 2) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "membership_tiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tier" "tier_name" NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"billing_cycles" jsonb DEFAULT '["monthly"]'::jsonb NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tiers_tier_unique" UNIQUE("tier")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"order_id" integer,
	"rating" integer NOT NULL,
	"review_text" text NOT NULL,
	"user_tier" "customer_tier" DEFAULT 'standard' NOT NULL,
	"user_name" varchar(200) NOT NULL,
	"user_avatar" text,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"reply_text" text,
	"reply_by" integer,
	"reply_by_name" varchar(200),
	"reply_by_role" varchar(30),
	"reply_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "security_lockouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(200),
	"reason" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tier_discounts" (
	"tier" varchar(30) PRIMARY KEY NOT NULL,
	"percent" numeric(5, 2) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "two_factor_otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"code_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"purpose" varchar(32) DEFAULT 'login' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "homepage" DROP CONSTRAINT IF EXISTS "homepage_section_unique";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_users_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
DROP INDEX IF EXISTS "notifications_user_idx";--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE varchar(80);--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "proof_photo_url" text;--> statement-breakpoint
ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "proof_signature_url" text;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "hero_image" text;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "hero_headline" varchar(200);--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "hero_tagline" text;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "featured_product_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "homepage" ADD COLUMN IF NOT EXISTS "lookbook_image_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "channels" varchar(30) DEFAULT 'inapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "scope" varchar(30) DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "target_user_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "target_tier" varchar(30);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "author_id" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "author_name" varchar(200) DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "author_role" varchar(30) DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "read_by" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "rider_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_sneak_peek" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sneak_peek_released_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "approved_by" integer;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "refunded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "bank_name" varchar(120);--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "account_number" varchar(30);--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "account_name" varchar(200);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_set_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bespoke_requests" ADD CONSTRAINT "bespoke_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bespoke_requests" ADD CONSTRAINT "bespoke_requests_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_verify_tokens" ADD CONSTRAINT "email_verify_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_discounts" ADD CONSTRAINT "event_discounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reply_by_users_id_fk" FOREIGN KEY ("reply_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "security_lockouts" ADD CONSTRAINT "security_lockouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "two_factor_otps" ADD CONSTRAINT "two_factor_otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bespoke_status_idx" ON "bespoke_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_discounts_active_idx" ON "event_discounts" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_approved_idx" ON "reviews" USING btree ("approved");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_product_unique" ON "reviews" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_lockouts_user_reason_idx" ON "security_lockouts" USING btree ("user_id","reason");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_lockouts_email_reason_idx" ON "security_lockouts" USING btree ("email","reason");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "security_lockouts_active_idx" ON "security_lockouts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "two_factor_user_idx" ON "two_factor_otps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "two_factor_purpose_idx" ON "two_factor_otps" USING btree ("user_id","purpose");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "returns" ADD CONSTRAINT "returns_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_scope_idx" ON "notifications" USING btree ("scope");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("target_user_id");--> statement-breakpoint
ALTER TABLE "homepage" DROP COLUMN IF EXISTS "section";--> statement-breakpoint
ALTER TABLE "homepage" DROP COLUMN IF EXISTS "content";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."audit_action";