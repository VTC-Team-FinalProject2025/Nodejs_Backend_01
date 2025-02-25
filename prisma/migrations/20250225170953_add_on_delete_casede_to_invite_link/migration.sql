-- DropForeignKey
ALTER TABLE `InviteLink` DROP FOREIGN KEY `InviteLink_serverId_fkey`;

-- AddForeignKey
ALTER TABLE `InviteLink` ADD CONSTRAINT `InviteLink_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `server`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
