import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { CookieKeys } from '../constants';
import JWT, { ServerAccessTokenPayload } from '../helpers/JWT';

const db = new PrismaClient();

// Hàm factory tạo middleware cho từng permission
export function checkPermission(permissionName: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authorization = req.cookies[CookieKeys.SERVER_TOKEN];
            if (!authorization) return res.status(401).json({ message: 'Không có token.' });

            const token = authorization.replace('Bearer ', '');
            const payload: ServerAccessTokenPayload = JWT.verifyToken(token, 'SERVER_ACCESS') as { userId: number, roleId: number, serverId: number, permissions: string[] };

            if (!payload.roleId) return res.status(403).json({ message: 'Không có quyền.' });

            if (payload.permissions.includes('owner')) return next();
            if (!payload.permissions.includes(permissionName)) return res.status(403).json({ message: 'Bạn không có quyền ' + permissionName });
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
    };
}
