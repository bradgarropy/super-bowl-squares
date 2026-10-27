CREATE TABLE `invite` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`claimed_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_player_id_idx` ON `invite` (`player_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `invite_token_hash_idx` ON `invite` (`token_hash`);