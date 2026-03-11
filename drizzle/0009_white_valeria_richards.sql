ALTER TABLE `classes` ADD `paymentMethod` enum('online','cash','both') DEFAULT 'online';--> statement-breakpoint
ALTER TABLE `events` ADD `paymentMethod` enum('online','cash','both') DEFAULT 'online';