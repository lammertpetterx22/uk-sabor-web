ALTER TABLE "events" ADD COLUMN "bannerUrl" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "showLowTicketAlert" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bankAccountHolderName" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bankSortCode" varchar(10);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bankAccountNumber" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bankDetailsVerified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "withdrawalRequests" ADD COLUMN "accountHolderName" varchar(255);--> statement-breakpoint
ALTER TABLE "withdrawalRequests" ADD COLUMN "sortCode" varchar(20);--> statement-breakpoint
ALTER TABLE "withdrawalRequests" ADD COLUMN "accountNumber" varchar(20);