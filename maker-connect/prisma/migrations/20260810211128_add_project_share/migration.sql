-- CreateTable: ProjectShare
CREATE TABLE `ProjectShare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `projectId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectShare_projectId_idx`(`projectId`),
    INDEX `ProjectShare_userId_idx`(`userId`),
    UNIQUE INDEX `ProjectShare_userId_projectId_key`(`userId`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: ProjectShare.userId -> User.id
ALTER TABLE `ProjectShare` ADD CONSTRAINT `ProjectShare_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: ProjectShare.projectId -> Project.id
ALTER TABLE `ProjectShare` ADD CONSTRAINT `ProjectShare_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
