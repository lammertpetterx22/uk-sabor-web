ALTER TABLE "classPurchases" ADD COLUMN "paymentStatus" varchar(20) DEFAULT 'paid';--> statement-breakpoint
ALTER TABLE "classPurchases" ADD COLUMN "paymentMethod" varchar(20);--> statement-breakpoint
ALTER TABLE "classPurchases" ADD COLUMN "paidAt" timestamp;--> statement-breakpoint
ALTER TABLE "classPurchases" ADD COLUMN "reservedAt" timestamp;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "allowCashPayment" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "allowOnlinePayment" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "cashPaymentInstructions" text;--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "paymentStatus" varchar(20) DEFAULT 'paid';--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "paymentMethod" varchar(20);--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "paidAt" timestamp;--> statement-breakpoint
ALTER TABLE "eventTickets" ADD COLUMN "reservedAt" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "allowCashPayment" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "allowOnlinePayment" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cashPaymentInstructions" text;--> statement-breakpoint
CREATE INDEX "class_purchases_payment_status_idx" ON "classPurchases" USING btree ("paymentStatus");--> statement-breakpoint
CREATE INDEX "event_tickets_payment_status_idx" ON "eventTickets" USING btree ("paymentStatus");