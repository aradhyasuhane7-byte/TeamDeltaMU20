CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`order_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_workspace_email` ON `members` (`workspace`,`email`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`number` text NOT NULL,
	`buyer` text NOT NULL,
	`product` text NOT NULL,
	`quantity` integer NOT NULL,
	`destination` text NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`entered` integer NOT NULL,
	`created` integer NOT NULL,
	`limits` text NOT NULL,
	`done` text DEFAULT '[]' NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`tracking` text DEFAULT '' NOT NULL,
	`courier` text DEFAULT '' NOT NULL,
	`revision` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `order_workspace_number` ON `orders` (`workspace`,`number`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL
);
