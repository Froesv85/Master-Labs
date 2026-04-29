-- CreateTable
CREATE TABLE `LgpdAuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `action` VARCHAR(191) NOT NULL,
    `projectId` INTEGER NULL,
    `userId` INTEGER NULL,
    `piiTypes` LONGTEXT NULL,
    `redactions` INTEGER NOT NULL DEFAULT 0,
    `context` VARCHAR(191) NULL,

    INDEX `LgpdAuditLog_projectId_idx`(`projectId`),
    INDEX `LgpdAuditLog_userId_idx`(`userId`),
    INDEX `LgpdAuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LgpdAuditLog` ADD CONSTRAINT `LgpdAuditLog_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LgpdAuditLog` ADD CONSTRAINT `LgpdAuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
