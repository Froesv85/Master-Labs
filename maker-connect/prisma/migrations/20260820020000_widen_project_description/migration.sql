-- AlterTable: Project.description was VARCHAR(191) by Prisma's default for
-- an unannotated String column, too short for real project descriptions
-- (P2000 error on prisma.project.create()). Widen it to TEXT.
ALTER TABLE `Project` MODIFY `description` TEXT NULL;
