CREATE TABLE `classPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`classId` int NOT NULL,
	`orderId` int,
	`accessCode` varchar(255),
	`status` enum('active','expired','cancelled') DEFAULT 'active',
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `classPurchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `classPurchases_accessCode_unique` UNIQUE(`accessCode`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`instructorId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`danceStyle` varchar(255),
	`level` enum('beginner','intermediate','advanced','all-levels') DEFAULT 'all-levels',
	`classDate` timestamp NOT NULL,
	`duration` int,
	`maxParticipants` int,
	`currentParticipants` int DEFAULT 0,
	`videoUrl` text,
	`status` enum('draft','published','cancelled','completed') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coursePurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`orderId` int,
	`progress` int DEFAULT 0,
	`completed` boolean DEFAULT false,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `coursePurchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`instructorId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`level` enum('beginner','intermediate','advanced','all-levels') DEFAULT 'all-levels',
	`danceStyle` varchar(255),
	`duration` varchar(255),
	`lessonsCount` int,
	`status` enum('draft','published','archived') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eventTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`orderId` int,
	`quantity` int DEFAULT 1,
	`ticketCode` varchar(255),
	`status` enum('valid','used','cancelled') DEFAULT 'valid',
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	CONSTRAINT `eventTickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `eventTickets_ticketCode_unique` UNIQUE(`ticketCode`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text,
	`venue` varchar(255) NOT NULL,
	`city` varchar(255),
	`eventDate` timestamp NOT NULL,
	`eventEndDate` timestamp,
	`ticketPrice` decimal(10,2) NOT NULL,
	`maxTickets` int,
	`ticketsSold` int DEFAULT 0,
	`status` enum('draft','published','cancelled','completed') DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instructors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`bio` text,
	`photoUrl` text,
	`instagramHandle` varchar(255),
	`specialties` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instructors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'GBP',
	`status` enum('pending','completed','failed','cancelled') DEFAULT 'pending',
	`itemType` enum('event','course','class') NOT NULL,
	`itemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
