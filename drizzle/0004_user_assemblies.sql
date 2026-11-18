ALTER TABLE `assembly` ADD `owner_id` text REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade;--> statement-breakpoint
CREATE INDEX `assembly_owner_id_idx` ON `assembly` (`owner_id`);