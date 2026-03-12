CREATE TABLE `clientTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientTokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`certificateId` int NOT NULL,
	`scheduledDate` timestamp NOT NULL,
	`completedDate` timestamp,
	`result` enum('pending','passed','failed','deferred') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signatureAuditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificateId` int NOT NULL,
	`userId` int NOT NULL,
	`signerName` varchar(255) NOT NULL,
	`signerNif` varchar(20),
	`signerCertSerial` varchar(100),
	`signerCertIssuer` text,
	`signerCertNotAfter` timestamp,
	`documentHash` varchar(64) NOT NULL,
	`signedDocumentHash` varchar(64),
	`timestampToken` text,
	`timestampTime` timestamp,
	`tsaUrl` varchar(255),
	`clientIp` varchar(45) NOT NULL,
	`userAgent` text,
	`rawCertificateB64` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signatureAuditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`formData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `certificates` MODIFY COLUMN `status` enum('draft','issued','submitted','registered','signed','archived') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `certificates` ADD `expedienteNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `certificates` ADD `submittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `certificates` ADD `locationCategory` varchar(50);--> statement-breakpoint
ALTER TABLE `certificates` ADD `electrificationGrade` varchar(20);--> statement-breakpoint
ALTER TABLE `certificates` ADD `maxAdmissiblePower` int;--> statement-breakpoint
ALTER TABLE `certificates` ADD `serviceCommissionDate` timestamp;--> statement-breakpoint
ALTER TABLE `certificates` ADD `lightingPointsCount` int;--> statement-breakpoint
ALTER TABLE `certificates` ADD `outletsCount` int;--> statement-breakpoint
ALTER TABLE `certificates` ADD `ambientTemp` int;--> statement-breakpoint
ALTER TABLE `certificates` ADD `installMethod` varchar(50);--> statement-breakpoint
ALTER TABLE `certificates` ADD `groupedCables` int;--> statement-breakpoint
ALTER TABLE `certificates` ADD `groundingSystem` varchar(10);--> statement-breakpoint
ALTER TABLE `circuits` ADD `installMethod` varchar(50);--> statement-breakpoint
ALTER TABLE `circuits` ADD `voltageDrop` decimal(6,2);--> statement-breakpoint
ALTER TABLE `circuits` ADD `designCurrent` decimal(8,2);--> statement-breakpoint
ALTER TABLE `profiles` ADD `companyAuthNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);