-- CreateTable
CREATE TABLE `FeedbackThread` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `category` ENUM('suggestion', 'bug', 'comment', 'question') NOT NULL DEFAULT 'suggestion',
    `subject` VARCHAR(160) NOT NULL,
    `status` ENUM('open', 'answered', 'closed') NOT NULL DEFAULT 'open',
    `pagePath` VARCHAR(512) NULL,
    `adminUnread` BOOLEAN NOT NULL DEFAULT true,
    `userUnread` BOOLEAN NOT NULL DEFAULT false,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FeedbackThread_userId_idx`(`userId`),
    INDEX `FeedbackThread_status_lastMessageAt_idx`(`status`, `lastMessageAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedbackMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `threadId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `fromAdmin` BOOLEAN NOT NULL DEFAULT false,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FeedbackMessage_threadId_createdAt_idx`(`threadId`, `createdAt`),
    INDEX `FeedbackMessage_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FeedbackThread` ADD CONSTRAINT `FeedbackThread_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackMessage` ADD CONSTRAINT `FeedbackMessage_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `FeedbackThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackMessage` ADD CONSTRAINT `FeedbackMessage_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

