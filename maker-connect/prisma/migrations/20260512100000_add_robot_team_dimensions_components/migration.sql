-- AlterTable: add team + dimensions/weight to Robot
ALTER TABLE `Robot`
  ADD COLUMN `teamId`   INT     NULL,
  ADD COLUMN `weightKg` DOUBLE  NULL,
  ADD COLUMN `lengthCm` DOUBLE  NULL,
  ADD COLUMN `widthCm`  DOUBLE  NULL,
  ADD COLUMN `heightCm` DOUBLE  NULL;

CREATE INDEX `Robot_teamId_idx` ON `Robot`(`teamId`);

ALTER TABLE `Robot`
  ADD CONSTRAINT `Robot_teamId_fkey`
  FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: RobotComponent
CREATE TABLE `RobotComponent` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `robotId`     INT           NOT NULL,
  `name`        VARCHAR(191)  NOT NULL,
  `quantity`    INT           NOT NULL DEFAULT 1,
  `description` VARCHAR(191)  NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `RobotComponent_robotId_idx`(`robotId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RobotComponent`
  ADD CONSTRAINT `RobotComponent_robotId_fkey`
  FOREIGN KEY (`robotId`) REFERENCES `Robot`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
