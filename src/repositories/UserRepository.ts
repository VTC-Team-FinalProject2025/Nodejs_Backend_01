
import { PrismaClient } from '@prisma/client';

type UserCreateInput = {
    firstName: string;
    lastName: string;
    loginName: string;
    email: string;
    phone: string;
    password: string;
    status?: boolean;
    isEmailVertify?: boolean;
};

type UserUpdateInput = {
    firstName?: string;
    lastName?: string;
    loginName?: string;
    // email?: string;
    // phone?: string;
    password?: string;
    status?: boolean;
    isEmailVertify?: boolean;
    updatedAt?: Date;
};


export default class UserRepository {
    public prisma: PrismaClient;
    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }
    async createUser(data: UserCreateInput) {
        return await this.prisma.users.create({
            data,
        });
    }
    async getUserByEmail(email: string) {
        return await this.prisma.users.findUnique({
            where: {
                email,
            },
        });
    }
    async getUserByPhone(phone: string) {
        return await this.prisma.users.findUnique({
            where: {
                phone,
            },
        });
    }
    async getUserByLoginName(name: string){
        return await this.prisma.users.findUnique({
            where: {
                loginName: name,
            },
        });
    }
    async getUserById(id: number) {
        return await this.prisma.users.findUnique({
            where: {
                id,
            },
        });
    }
    async updateUser(id: number, data: UserUpdateInput) {
        return await this.prisma.users.update({
            where: {
                id,
            },
            data,
        });
    }
}