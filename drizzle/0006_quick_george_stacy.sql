CREATE TABLE `recovery_backups` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`kind` text NOT NULL,
	`key` text NOT NULL,
	`created` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recovery_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`account` text NOT NULL,
	`created` integer NOT NULL,
	`status` text DEFAULT 'Requested' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reset_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`account` text NOT NULL,
	`expires` integer NOT NULL,
	`claim` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runtime_errors` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace` text NOT NULL,
	`scope` text NOT NULL,
	`message` text NOT NULL,
	`created` integer NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_locks` (
	`workspace` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `members` ADD `lead` integer DEFAULT 0 NOT NULL;