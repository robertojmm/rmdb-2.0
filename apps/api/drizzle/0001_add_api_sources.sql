CREATE TABLE `api_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`needs_configuration` integer DEFAULT false NOT NULL,
	`configuration` text
);
