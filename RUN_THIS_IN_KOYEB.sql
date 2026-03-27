-- RUN THIS IN KOYEB CONSOLE TO FIX DATABASE
-- Copy each line ONE BY ONE and paste into Koyeb Console

-- Add bank details columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountHolderName" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankSortCode" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankDetailsVerified" BOOLEAN DEFAULT false;

-- Add payment proof column to withdrawalRequests table
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
