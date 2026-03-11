CREATE TABLE `crmContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`phone` varchar(20),
	`address` text,
	`city` varchar(255),
	`country` varchar(255),
	`postalCode` varchar(20),
	`segment` enum('lead','customer','vip','inactive') DEFAULT 'lead',
	`status` enum('active','inactive','unsubscribed') DEFAULT 'active',
	`source` varchar(255),
	`lastContactDate` timestamp,
	`totalPurchases` decimal(10,2) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmContacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `crmContacts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `crmInteractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`type` enum('email','call','message','meeting','note') NOT NULL,
	`subject` varchar(255),
	`content` text,
	`status` enum('pending','completed','follow_up') DEFAULT 'pending',
	`scheduledDate` timestamp,
	`completedDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmInteractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int NOT NULL,
	`content` text NOT NULL,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmNotes_id` PRIMARY KEY(`id`)
);
