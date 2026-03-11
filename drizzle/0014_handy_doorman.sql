CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`htmlContent` text NOT NULL,
	`templateId` int,
	`status` enum('draft','scheduled','sending','sent','failed') DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`totalRecipients` int DEFAULT 0,
	`totalSent` int DEFAULT 0,
	`totalOpened` int DEFAULT 0,
	`totalClicked` int DEFAULT 0,
	`segment` enum('all','lead','customer','vip','inactive') DEFAULT 'all',
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailClicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`contactId` int NOT NULL,
	`url` text NOT NULL,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `emailClicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailOpens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`contactId` int NOT NULL,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` varchar(512),
	CONSTRAINT `emailOpens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('event','course','class','promotion','newsletter','custom') DEFAULT 'custom',
	`subject` varchar(500) NOT NULL,
	`htmlContent` text NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
