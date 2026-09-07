CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `hackathon_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`team` text NOT NULL,
	`title` text NOT NULL,
	`domain` text,
	`agency` text,
	`leader_name` text NOT NULL,
	`leader_position` text,
	`leader_email` text NOT NULL,
	`leader_mobile` text,
	`members` text,
	`endorsing_head` text,
	`object_key` text,
	`file_name` text,
	`file_size` integer,
	`mime_type` text,
	`status` text NOT NULL,
	`consented_at` integer NOT NULL,
	`privacy_notice_version` text NOT NULL,
	`documentation_consent` integer NOT NULL,
	`member_consent_attested` integer NOT NULL,
	`retention_until` integer NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`organization` text,
	`dietary_accessibility` text,
	`consented_at` integer NOT NULL,
	`privacy_notice_version` text NOT NULL,
	`documentation_consent` integer NOT NULL,
	`retention_until` integer NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL
);
