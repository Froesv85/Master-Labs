-- AlterTable
ALTER TABLE `ProjectExtractionLog` ADD COLUMN `auditFlags` TEXT NULL,
    ADD COLUMN `auditScore` INTEGER NULL,
    ADD COLUMN `bomClusterLabel` VARCHAR(191) NULL,
    ADD COLUMN `missingComponents` TEXT NULL,
    ADD COLUMN `predictedCategory` VARCHAR(191) NULL,
    ADD COLUMN `predictedDifficulty` VARCHAR(191) NULL,
    ADD COLUMN `predictedDomains` TEXT NULL;
