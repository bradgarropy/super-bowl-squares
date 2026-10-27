DROP INDEX `player_invite_token_hash_idx`;--> statement-breakpoint
ALTER TABLE `player` DROP COLUMN `invite_token_hash`;