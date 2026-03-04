CREATE TABLE `movie_drafts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_path` text NOT NULL,
	`parsed_title` text,
	`parsed_year` integer,
	`saved_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `movie_drafts_file_path_unique` ON `movie_drafts` (`file_path`);