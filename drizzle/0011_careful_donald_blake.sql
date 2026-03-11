CREATE TABLE `classInstructors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`instructorId` int NOT NULL,
	`role` enum('lead','assistant') DEFAULT 'lead',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classInstructors_id` PRIMARY KEY(`id`)
);
