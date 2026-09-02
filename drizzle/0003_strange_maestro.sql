CREATE TABLE `board` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`owner_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `board_game_id_idx` ON `board` (`game_id`);--> statement-breakpoint
CREATE INDEX `board_owner_id_idx` ON `board` (`owner_id`);