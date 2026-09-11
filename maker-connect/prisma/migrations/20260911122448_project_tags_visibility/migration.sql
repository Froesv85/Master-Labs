-- AlterTable (additive only — category stays until the backfill below completes)
ALTER TABLE `Project`
    ADD COLUMN `objective` TEXT NULL,
    ADD COLUMN `teamId` INTEGER NULL,
    ADD COLUMN `visibility` ENUM('public', 'private_owner', 'private_team') NOT NULL DEFAULT 'public';

-- CreateTable
CREATE TABLE `ProjectTag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `tag` ENUM('3D_Printing', 'Robotics', 'IoT', 'Woodworking') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectTag_projectId_idx`(`projectId`),
    INDEX `ProjectTag_tag_idx`(`tag`),
    UNIQUE INDEX `ProjectTag_projectId_tag_key`(`projectId`, `tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProjectComponent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(191) NULL,

    INDEX `ProjectComponent_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Project_visibility_idx` ON `Project`(`visibility`);

-- CreateIndex
CREATE INDEX `Project_teamId_idx` ON `Project`(`teamId`);

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectTag` ADD CONSTRAINT `ProjectTag_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectComponent` ADD CONSTRAINT `ProjectComponent_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- DataMigration: backfill one ProjectTag per existing project from its current category,
-- before a later migration drops the category column.
INSERT INTO `ProjectTag` (`projectId`, `tag`, `createdAt`)
SELECT `id`, `category`, NOW(3) FROM `Project`;
