import * as dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH!;
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
    REFRESH: "refresh_token"
}