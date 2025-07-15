CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`map_name` text NOT NULL,
	`game_mode` text,
	`match_start_at` integer NOT NULL,
	`game_version` text
);
--> statement-breakpoint
CREATE TABLE `match_rounds` (
	`id` integer PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`winning_team` text,
	`round_result` text,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `match_id_idx` ON `match_rounds` (`match_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `match_id_round_number_idx` ON `match_rounds` (`match_id`,`round_number`);--> statement-breakpoint
CREATE TABLE `player_match_stats` (
	`id` integer PRIMARY KEY NOT NULL,
	`player_id` integer NOT NULL,
	`match_id` text NOT NULL,
	`agent_name` text NOT NULL,
	`kills` integer NOT NULL,
	`deaths` integer NOT NULL,
	`assists` integer NOT NULL,
	`combat_score` integer,
	`won` integer NOT NULL,
	`etc_data` text,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_id_match_id_idx` ON `player_match_stats` (`player_id`,`match_id`);--> statement-breakpoint
CREATE TABLE `players` (
	`id` integer PRIMARY KEY NOT NULL,
	`puuid` text NOT NULL,
	`game_name` text,
	`tag_line` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `players_puuid_unique` ON `players` (`puuid`);--> statement-breakpoint
CREATE UNIQUE INDEX `game_name_tag_line_idx` ON `players` (`game_name`,`tag_line`);