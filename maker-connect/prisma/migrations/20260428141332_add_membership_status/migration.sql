-- AlterTable
ALTER TABLE `CommunityMember` ADD COLUMN `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved';

-- CreateIndex
CREATE INDEX `CommunityMember_communityId_status_idx` ON `CommunityMember`(`communityId`, `status`);
