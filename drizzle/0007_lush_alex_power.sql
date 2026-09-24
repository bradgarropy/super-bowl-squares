ALTER TABLE `player` ADD `invite_token_hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `player_invite_token_hash_idx` ON `player` (`invite_token_hash`);