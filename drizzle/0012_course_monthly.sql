ALTER TABLE "courses" ADD COLUMN "paymentType" varchar(20) DEFAULT 'one_time' NOT NULL;
--> statement-breakpoint
ALTER TABLE "coursePurchases" ADD COLUMN "stripeSubscriptionId" text;
--> statement-breakpoint
ALTER TABLE "coursePurchases" ADD COLUMN "subscriptionStatus" varchar(20) DEFAULT 'active';
