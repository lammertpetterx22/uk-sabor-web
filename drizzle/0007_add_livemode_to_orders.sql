-- Migration: Add livemode column to orders table
-- Purpose: Track test vs production transactions for earnings dashboard
-- Date: 2026-03-16

-- Add livemode column (defaults to true for existing orders)
ALTER TABLE "orders" ADD COLUMN "livemode" boolean DEFAULT true NOT NULL;

-- Add index for faster filtering by livemode
CREATE INDEX IF NOT EXISTS "orders_livemode_idx" ON "orders" ("livemode");

-- Add comment to document the column
COMMENT ON COLUMN "orders"."livemode" IS 'Track test (false) vs production (true) transactions from Stripe';
