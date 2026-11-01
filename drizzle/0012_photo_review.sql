ALTER TABLE `photos` ADD `digest` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `photos` ADD `evidence` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `photos` ADD `review` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `photo_workspace_digest` ON `photos` (`workspace`,`digest`);