-- AlterTable
ALTER TABLE `Lesson` ADD COLUMN `contentType` ENUM('TEXT', 'VIDEO', 'IMAGE', 'FILE', 'EMBED') NOT NULL DEFAULT 'TEXT',
    ADD COLUMN `mediaUrl` VARCHAR(191) NULL;
