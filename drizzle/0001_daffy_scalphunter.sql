CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`order_id` text NOT NULL,
	`stage` integer NOT NULL,
	`actor` text NOT NULL,
	`at` integer NOT NULL,
	`key` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `meta` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deleted` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaces` ADD `settings` text DEFAULT '{}' NOT NULL;