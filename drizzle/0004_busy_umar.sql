CREATE TABLE `board_member` (
	`id` text PRIMARY KEY NOT NULL,
	`board_id` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`board_id`) REFERENCES `board`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `board_member_board_id_email_idx` ON `board_member` (`board_id`,`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `board_member_board_id_user_id_idx` ON `board_member` (`board_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `board_member_user_id_idx` ON `board_member` (`user_id`);