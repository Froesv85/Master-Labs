-- AlterTable: add media + printer config fields to Project
ALTER TABLE `Project`
  ADD COLUMN `coverImageUrl`      VARCHAR(2048) NULL,
  ADD COLUMN `printerBrand`       VARCHAR(100)  NULL,
  ADD COLUMN `printerModel`       VARCHAR(100)  NULL,
  ADD COLUMN `printerNozzle`      VARCHAR(20)   NULL,
  ADD COLUMN `printerMaterial`    VARCHAR(50)   NULL,
  ADD COLUMN `printerLayerHeight` VARCHAR(20)   NULL;

-- CreateTable: ProjectImage
CREATE TABLE `ProjectImage` (
  `id`        INT          NOT NULL AUTO_INCREMENT,
  `projectId` INT          NOT NULL,
  `imageUrl`  VARCHAR(2048) NOT NULL,
  `position`  INT          NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ProjectImage_projectId_idx`(`projectId`),
  INDEX `ProjectImage_projectId_position_idx`(`projectId`, `position`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: ProjectImage.projectId -> Project.id
ALTER TABLE `ProjectImage`
  ADD CONSTRAINT `ProjectImage_projectId_fkey`
  FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: ProjectFile
CREATE TABLE `ProjectFile` (
  `id`         INT           NOT NULL AUTO_INCREMENT,
  `projectId`  INT           NOT NULL,
  `fileName`   VARCHAR(255)  NOT NULL,
  `fileUrl`    VARCHAR(2048) NOT NULL,
  `fileType`   VARCHAR(20)   NOT NULL,
  `fileSizeKb` INT           NOT NULL,
  `createdAt`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ProjectFile_projectId_idx`(`projectId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey: ProjectFile.projectId -> Project.id
ALTER TABLE `ProjectFile`
  ADD CONSTRAINT `ProjectFile_projectId_fkey`
  FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
