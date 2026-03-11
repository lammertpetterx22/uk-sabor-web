ALTER TABLE `qrCodes` ADD `isUsed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `qrCodes` ADD `usedAt` timestamp;