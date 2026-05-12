-- AlterTable
ALTER TABLE `Community` ADD COLUMN `coverUrl` VARCHAR(2048) NULL,
    ADD COLUMN `videoUrl` VARCHAR(512) NULL,
    MODIFY `avatarUrl` VARCHAR(2048) NULL;

-- AlterTable
ALTER TABLE `CommunityPost` ADD COLUMN `videoUrl` VARCHAR(512) NULL;

-- AlterTable
ALTER TABLE `Robot` ADD COLUMN `videoUrl` VARCHAR(512) NULL;

-- AlterTable
ALTER TABLE `Team` ADD COLUMN `videoUrl` VARCHAR(512) NULL,
    MODIFY `avatarUrl` VARCHAR(2048) NULL;

-- AlterTable
ALTER TABLE `UserProfile` ADD COLUMN `videoUrl` VARCHAR(512) NULL,
    MODIFY `avatarUrl` VARCHAR(2048) NULL;

-- CreateTable
CREATE TABLE `RobotImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `robotId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(2048) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RobotImage_robotId_idx`(`robotId`),
    INDEX `RobotImage_robotId_position_idx`(`robotId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RobotImage` ADD CONSTRAINT `RobotImage_robotId_fkey` FOREIGN KEY (`robotId`) REFERENCES `Robot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
