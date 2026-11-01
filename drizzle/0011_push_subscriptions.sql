CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`account` text NOT NULL,
	`role` text NOT NULL,
	`endpoint` text NOT NULL,
	`subscription` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `push_workspace_role` ON `push_subscriptions` (`workspace`,`role`);