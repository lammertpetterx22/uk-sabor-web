-- Add bank details fields to users table for automatic payouts
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountHolderName" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankSortCode" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankAccountNumber" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "bankDetailsVerified" BOOLEAN DEFAULT false;

-- Add payment proof field to withdrawal requests
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
