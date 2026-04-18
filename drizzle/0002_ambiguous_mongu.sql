CREATE TABLE `mandiri_komentar` (
	`id` text PRIMARY KEY NOT NULL,
	`penerima_id` text NOT NULL,
	`pengirim_nama` text,
	`is_anonim` integer DEFAULT 0,
	`komentar` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`penerima_id`) REFERENCES `generus`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mandiri_komentar_penerima_id_idx` ON `mandiri_komentar` (`penerima_id`);--> statement-breakpoint
ALTER TABLE `mandiri_pemilihan` ADD `hasil_pengirim` text;--> statement-breakpoint
ALTER TABLE `mandiri_pemilihan` ADD `hasil_penerima` text;