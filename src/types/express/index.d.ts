import { User } from '@prisma/client'; // Import kiểu User từ Prisma
declare global {
    namespace Express {
        interface Request {
            user: User;
        }
    }
}