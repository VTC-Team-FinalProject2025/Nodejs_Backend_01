import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    await db.permission.createMany({
        data: [
            // Quản lý server
            { name: 'manage_server', description: 'Quản lý cài đặt máy chủ' },
            { name: 'manage_roles', description: 'Quản lý các vai trò' },
            { name: 'manage_channels', description: 'Quản lý các kênh' },
            { name: 'manage_invites', description: 'Quản lý mã mời' },
            { name: 'view_invite', description: 'Chia sẻ mã mời' },
            // Thành viên
            { name: 'kick_members', description: 'Đá thành viên khỏi server' },
            // Tin nhắn
            { name: 'send_messages', description: 'Gửi tin nhắn' },

            // Kênh thoại
            { name: 'connect', description: 'Kết nối vào kênh thoại' },
            { name: 'speak', description: 'Nói trong kênh thoại' },
            { name: 'share_screen', description: 'Chia sẻ màn hình trong kênh thoại' },
            { name: 'turn_on_camera', description: 'Bật hoặc tắt camera trong kênh thoại' }
        ],
        skipDuplicates: true,
    });
}

main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await db.$disconnect();
        process.exit(1);
    });
