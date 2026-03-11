CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('starter','creator','promoter_plan','academy') NOT NULL DEFAULT 'starter',
	`status` enum('active','cancelled','past_due','trialing','incomplete') NOT NULL DEFAULT 'active',
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usageTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`periodYear` int NOT NULL,
	`periodMonth` int NOT NULL,
	`eventsCreated` int NOT NULL DEFAULT 0,
	`classesCreated` int NOT NULL DEFAULT 0,
	`coursesCreated` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usageTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','instructor','promoter','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlan` enum('starter','creator','promoter_plan','academy') DEFAULT 'starter' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);