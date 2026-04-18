CREATE TABLE `pengurus` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`dapukan` text NOT NULL,
	`alamat` text NOT NULL,
	`foto` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
ALTER TABLE `mandiri_komentar` ADD `pengirim_id` text REFERENCES generus(id);--> statement-breakpoint
CREATE INDEX `mandiri_komentar_pengirim_id_idx` ON `mandiri_komentar` (`pengirim_id`);