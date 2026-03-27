-- RUN THIS IN KOYEB CONSOLE TO FIX DATABASE
-- Copy each line ONE BY ONE and paste into Koyeb Console

-- Add bank details fields to withdrawalRequests table (for withdrawal flow)
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountHolderName" VARCHAR(255);
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "sortCode" VARCHAR(20);
ALTER TABLE "withdrawalRequests" ADD COLUMN IF NOT EXISTS "accountNumber" VARCHAR(20);
