-- CreateTable
CREATE TABLE `AppSetting` (
    `key` VARCHAR(64) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedById` INTEGER NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
