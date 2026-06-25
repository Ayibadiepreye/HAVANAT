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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
 ALTER TABLE "two_factor_otps" ADD CONSTRAINT "two_factor_otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bespoke_status_idx" ON "bespoke_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_discounts_active_idx" ON "event_discounts" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "two_factor_user_idx" ON "two_factor_otps" USING btree ("user_id");

ALTER TABLE "notifications" DROP COLUMN IF EXISTS "channels";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "scope";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "target_user_id";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "target_tier";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "author_id";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "author_name";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "author_role";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read_by";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "user_id";
--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "read";
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "user_id" integer REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "category" varchar(60) DEFAULT 'system' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "title" varchar(200) NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "body" text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "channels" varchar(30) DEFAULT 'inapp' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "scope" varchar(30) DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "target_user_id" integer REFERENCES users(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "target_tier" varchar(30);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "author_id" integer REFERENCES users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "author_name" varchar(200) DEFAULT 'system' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "author_role" varchar(30) DEFAULT 'system' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_by" jsonb DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" USING btree ("target_user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_scope_idx" ON "notifications" USING btree ("scope");
