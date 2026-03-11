CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('event','class') NOT NULL,
	`itemId` int NOT NULL,
	`qrCodeId` int,
	`checkedInAt` timestamp NOT NULL DEFAULT (now()),
	`checkedInBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qrCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(255) NOT NULL,
	`itemType` enum('event','class') NOT NULL,
	`itemId` int NOT NULL,
	`qrData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qrCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `qrCodes_code_unique` UNIQUE(`code`)
);
