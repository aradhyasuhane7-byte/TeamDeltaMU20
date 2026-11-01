CREATE INDEX `event_workspace_id` ON `events` (`workspace`,`id`);--> statement-breakpoint
CREATE INDEX `event_workspace_at` ON `events` (`workspace`,`at`);--> statement-breakpoint
CREATE INDEX `order_workspace_id` ON `orders` (`workspace`,`id`);--> statement-breakpoint
CREATE INDEX `photo_workspace_id` ON `photos` (`workspace`,`id`);--> statement-breakpoint
CREATE INDEX `backup_workspace_created` ON `recovery_backups` (`workspace`,`created`);--> statement-breakpoint
CREATE INDEX `backup_workspace_kind_created` ON `recovery_backups` (`workspace`,`kind`,`created`);--> statement-breakpoint
CREATE INDEX `error_workspace_resolved` ON `runtime_errors` (`workspace`,`resolved`);