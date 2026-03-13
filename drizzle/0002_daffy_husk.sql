CREATE TABLE "balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"currentBalance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"pendingBalance" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"totalEarned" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"totalWithdrawn" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(3) DEFAULT 'GBP' NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "balances_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "ledgerTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"orderId" integer,
	"status" varchar(50) DEFAULT 'completed' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawalRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"adminNotes" text,
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	"processedAt" timestamp,
	"processedBy" integer
);
--> statement-breakpoint
ALTER TABLE "classPurchases" ADD COLUMN "instructorId" integer;--> statement-breakpoint
ALTER TABLE "classPurchases" ADD COLUMN "pricePaid" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "classPurchases" ADD COLUMN "platformFee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "classPurchases" ADD COLUMN "instructorEarnings" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "coursePurchases" ADD COLUMN "instructorId" integer;--> statement-breakpoint
ALTER TABLE "coursePurchases" ADD COLUMN "pricePaid" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "coursePurchases" ADD COLUMN "platformFee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "coursePurchases" ADD COLUMN "instructorEarnings" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "instructorId" integer;--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "pricePaid" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "platformFee" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "instructorEarnings" numeric(10, 2);