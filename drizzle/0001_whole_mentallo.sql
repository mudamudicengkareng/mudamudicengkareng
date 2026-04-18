CREATE TABLE `form_panitia_dan_pengurus` (
	`id` text PRIMARY KEY NOT NULL,
	`generus_id` text,
	`nama` text NOT NULL,
	`jenis_kelamin` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`alamat` text,
	`no_telp` text,
	`suku` text,
	`foto` text,
	`mandiri_desa_id` integer,
	`mandiri_kelompok_id` integer,
	`dapukan` text,
	`nomor_unik` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`generus_id`) REFERENCES `generus`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mandiri_desa_id`) REFERENCES `mandiri_desa`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`mandiri_kelompok_id`) REFERENCES `mandiri_kelompok`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `form_panitia_dan_pengurus_generus_id_idx` ON `form_panitia_dan_pengurus` (`generus_id`);--> statement-breakpoint
CREATE INDEX `form_panitia_dan_pengurus_nama_idx` ON `form_panitia_dan_pengurus` (`nama`);--> statement-breakpoint
CREATE INDEX `form_panitia_dan_pengurus_dapukan_idx` ON `form_panitia_dan_pengurus` (`dapukan`);