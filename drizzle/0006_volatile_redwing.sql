CREATE TABLE `square` (
	`board_id` text NOT NULL,
	`player_id` text NOT NULL,
	`row` integer NOT NULL,
	`column` integer NOT NULL,
	PRIMARY KEY(`board_id`, `row`, `column`),
	FOREIGN KEY (`board_id`) REFERENCES `board`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "square_row_check" CHECK("square"."row" between 0 and 9),
	CONSTRAINT "square_column_check" CHECK("square"."column" between 0 and 9)
);
--> statement-breakpoint
CREATE INDEX `square_player_id_idx` ON `square` (`player_id`);