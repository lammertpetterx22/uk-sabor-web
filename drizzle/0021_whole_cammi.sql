CREATE TABLE `lessonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lessonId` int NOT NULL,
	`watchPercent` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessonProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`videoUrl` text,
	`position` int NOT NULL,
	`durationSeconds` int,
	`isPreview` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `roles` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `additionalRoles`;