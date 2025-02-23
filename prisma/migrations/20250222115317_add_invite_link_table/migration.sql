-- CreateTable
CREATE TABLE `InviteLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serverId` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expireAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InviteLink_serverId_key`(`serverId`),
    UNIQUE INDEX `InviteLink_token_key`(`token`),
    INDEX `InviteLink_serverId_idx`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InviteLink` ADD CONSTRAINT `InviteLink_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `server`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
