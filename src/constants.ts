import * as dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH!;
export const JWT_SERVER_ACCESS = process.env.JWT_SERVER_ACCESS!;
export const URL_CLIENT = process.env.URL_CLIENT!;
export const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS!;
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD!;
export const JWT_SECRET_RESET_PASSWORD = process.env.JWT_SECRET_RESET_PASSWORD!;
export const BYCRYPT_SALT = parseInt(process.env.BYCRYPT_SALT!);
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
export const DB_FIREBASE = process.env.DB_FIREBASE!;
export const REDIS_URI = process.env.REDIS_URI!;
export const CookieKeys = {
    ACCESS_TOKEN: "token",
    REFRESH: "refresh_token",
    USER_INFO: "user_info",
    CHANNEL_TOKEN: "channelToken",
    SERVER_TOKEN: "serverToken",
}
export const DEFAULT_SERVER_ICON = "https://robohash.org/adad";

export const PERMISSION_NAMES = {
    MANAGE_SERVER: "manage_server",
    MANAGE_ROLES: "manage_roles",
    MANAGE_CHANNELS: "manage_channels",
    MANAGE_INVITES: "manage_invites",
    VIEW_INVITE: "view_invite",
    KICK_MEMBERS: "kick_members",
    SEND_MESSAGES: "send_messages",
    CONNECT: "connect",
    SPEAK: "speak",
    SHARE_SCREEN: "share_screen",
    TURN_ON_CAMERA: "turn_on_camera",
}
export const SECURITY_KEY = process.env.SECURITY_KEY!;
export const SECURITY_VECTOR = process.env.SECURITY_VECTOR!;
export const ALGORITHM = process.env.ALGORITHM!;
