-- CreateTable
CREATE TABLE `SiteVisitDaily` (
    `day` DATE NOT NULL,
    `authenticated` BOOLEAN NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`day`, `authenticated`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
