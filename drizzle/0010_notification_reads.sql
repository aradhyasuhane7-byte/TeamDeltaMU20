CREATE TABLE `notification_reads` (
	`workspace` text NOT NULL,
	`account` text NOT NULL,
	`notification` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_read_unique` ON `notification_reads` (`workspace`,`account`,`notification`);