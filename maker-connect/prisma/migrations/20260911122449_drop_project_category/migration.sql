-- DropIndex
DROP INDEX `Project_category_idx` ON `Project`;

-- AlterTable
ALTER TABLE `Project` DROP COLUMN `category`;
