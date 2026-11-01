CREATE TABLE `encryption_progress` (
	`workspace` text PRIMARY KEY NOT NULL,
	`phase` text NOT NULL,
	`cursor` text DEFAULT '' NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `security_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`type` text NOT NULL,
	`actor` text NOT NULL,
	`detail` text NOT NULL,
	`created` integer NOT NULL,
	`acknowledged` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `security_workspace_created` ON `security_alerts` (`workspace`,`created`);