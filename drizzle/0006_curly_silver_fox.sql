ALTER TABLE "instructorApplications" ADD COLUMN "emailUpdates" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "instructorApplications" ADD COLUMN "emailPromotions" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "instructorApplications" ADD COLUMN "emailCommunity" boolean DEFAULT true;