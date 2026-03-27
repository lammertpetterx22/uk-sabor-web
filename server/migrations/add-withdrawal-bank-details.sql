-- Add bank details fields to withdrawalRequests table
-- These fields will be filled by users when requesting a withdrawal

ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountHolderName" VARCHAR(255);
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "sortCode" VARCHAR(20);
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(20);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "withdrawalRequests_status_idx" ON "withdrawalRequests"("status");
CREATE INDEX IF NOT EXISTS "withdrawalRequests_userId_idx" ON "withdrawalRequests"("userId");
