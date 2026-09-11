-- Rename (not drop+add) — preserves existing log data.
ALTER TABLE `ProjectExtractionLog`
    CHANGE COLUMN `n8nExecutionId` `jobId` VARCHAR(191) NULL,
    CHANGE COLUMN `n8nTriggerMs` `queueWaitMs` INTEGER NULL;
