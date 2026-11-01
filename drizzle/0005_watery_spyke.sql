CREATE TABLE `service_config` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_chats` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`source` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `support_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`created` integer NOT NULL
);
