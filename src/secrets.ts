import * as dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH!;
export const URL_CLIENT = process.env.URL_CLIENT!;
export const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS!;
export const MAIL_PASSWORD = process.env.MAIL_PASSWORD!;
export const JWT_SECRET_RESET_PASSWORD = process.env.JWT_SECRET_RESET_PASSWORD!;