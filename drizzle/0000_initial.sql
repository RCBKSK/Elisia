
-- Initial database schema migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table for express-session
CREATE TABLE IF NOT EXISTS "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar NOT NULL,
	"password" varchar NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"is_approved" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

-- Kingdoms table
CREATE TABLE IF NOT EXISTS "kingdoms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"lok_kingdom_id" varchar,
	"level" integer DEFAULT 1,
	"image_url" varchar,
	"status" varchar DEFAULT 'active',
	"total_contributions" numeric(10,2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "kingdoms_lok_kingdom_id_unique" UNIQUE("lok_kingdom_id")
);

-- Contributions table
CREATE TABLE IF NOT EXISTS "contributions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kingdom_id" varchar NOT NULL,
	"amount" numeric(10,2) NOT NULL,
	"period" varchar NOT NULL,
	"description" text,
	"is_paid" boolean DEFAULT false,
	"payout_id" varchar,
	"created_at" timestamp DEFAULT now()
);

-- Payment settings table
CREATE TABLE IF NOT EXISTS "payment_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_rate_per_point" numeric(10,4) NOT NULL,
	"minimum_payout" numeric(10,2) DEFAULT '10.00',
	"payout_frequency" varchar DEFAULT 'monthly',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"updated_by" varchar NOT NULL
);

-- Payouts table
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_amount" numeric(10,2) NOT NULL,
	"total_points" numeric(10,2) NOT NULL,
	"wallet_address" varchar NOT NULL,
	"payment_settings_id" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"transaction_hash" varchar,
	"admin_notes" text,
	"period_from" timestamp NOT NULL,
	"period_to" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"processed_by" varchar
);

-- User payout summary table
CREATE TABLE IF NOT EXISTS "user_payout_summary" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"last_payout_date" timestamp,
	"total_earned" numeric(10,2) DEFAULT '0',
	"total_paid" numeric(10,2) DEFAULT '0',
	"pending_amount" numeric(10,2) DEFAULT '0',
	"unpaid_contributions" numeric(10,2) DEFAULT '0',
	"updated_at" timestamp DEFAULT now()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS "wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"address" varchar NOT NULL,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

-- Payment requests table
CREATE TABLE IF NOT EXISTS "payment_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"kingdom_id" varchar,
	"amount" numeric(10,2) NOT NULL,
	"wallet_address" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'pending',
	"admin_notes" text,
	"requested_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"processed_by" varchar
);

-- Foreign key constraints
DO $$ BEGIN
 ALTER TABLE "kingdoms" ADD CONSTRAINT "kingdoms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contributions" ADD CONSTRAINT "contributions_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "kingdoms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payment_settings_id_payment_settings_id_fk" FOREIGN KEY ("payment_settings_id") REFERENCES "payment_settings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_payout_summary" ADD CONSTRAINT "user_payout_summary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_kingdom_id_kingdoms_id_fk" FOREIGN KEY ("kingdom_id") REFERENCES "kingdoms"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
