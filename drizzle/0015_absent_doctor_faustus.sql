ALTER TABLE `crmContacts` ADD `engagementScore` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `crmContacts` ADD `engagementTier` enum('cold','warm','hot','champion') DEFAULT 'cold';--> statement-breakpoint
ALTER TABLE `crmContacts` ADD `scoreUpdatedAt` timestamp;