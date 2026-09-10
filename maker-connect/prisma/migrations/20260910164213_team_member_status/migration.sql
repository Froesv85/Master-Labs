-- AlterTable
ALTER TABLE `TeamMember` ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved';

-- CreateIndex
CREATE INDEX `TeamMember_teamId_status_idx` ON `TeamMember`(`teamId`, `status`);
