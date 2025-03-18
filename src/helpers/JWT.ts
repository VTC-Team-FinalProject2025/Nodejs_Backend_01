import * as jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_SECRET_REFRESH, JWT_SECRET_RESET_PASSWORD, JWT_SERVER_ACCESS } from "../constants";
interface TokenPayload {
    userId: number;
    [key: string]: any;
}

interface ServerAccessTokenPayload {
    iss: string,
    aud: "jitsi",
    sub: "jitsi-vtc.duckdns.org",
    room: string,
    context: {
        user: {
            id: number,
            name: string,
            avatar: string,
        }
    }
}

export interface AuthTokenPayload {
    userId: number;
}

export type secretType = "ACCESS" | "REFRESH" | "RESET_PASSWORD" | "VERTIFY_EMAIL" | "SERVER_ACCESS";

const defaultOption = { expiresIn: 15 };
const JWT = {
    // Generate a token with a payload, secret, and expiration time (minutes)
    signToken: (payload: string | object, secret: string, option: { expiresIn: number } = defaultOption) => {
        const token: string = jwt.sign(payload, secret, { expiresIn: option.expiresIn * 60 });
        return token;
    },
    // Verify a token with a secret
    verifyToken: (token: string, secretType: secretType) => {
        switch (secretType) {
            case "ACCESS":
                return jwt.verify(token, JWT_SECRET) as TokenPayload;
            case "VERTIFY_EMAIL":
                return jwt.verify(token, JWT_SECRET) as TokenPayload;
            case "REFRESH":
                return jwt.verify(token, JWT_SECRET_REFRESH) as TokenPayload;
            case "RESET_PASSWORD":
                return jwt.verify(token, JWT_SECRET_RESET_PASSWORD) as TokenPayload;
            case "SERVER_ACCESS":
                return jwt.verify(token, JWT_SERVER_ACCESS) as ServerAccessTokenPayload;
            default:
                return jwt.verify(token, JWT_SECRET) as TokenPayload;
        }
    },
    generateToken: (payload: AuthTokenPayload | ServerAccessTokenPayload, secretType: secretType) => {
        switch (secretType) {
            case "ACCESS":
                return JWT.signToken(payload, JWT_SECRET);
            case "VERTIFY_EMAIL":
                return JWT.signToken(payload, JWT_SECRET);
            case "REFRESH":
                return JWT.signToken(payload, JWT_SECRET_REFRESH, {
                    expiresIn: 60 * 24 * 7,
                });
            case "RESET_PASSWORD":
                return JWT.signToken(payload, JWT_SECRET_RESET_PASSWORD, {
                    expiresIn: 5,
                });
            case "SERVER_ACCESS":
                return JWT.signToken(payload, JWT_SERVER_ACCESS, {
                    expiresIn: 60,
                });
            default:
                return JWT.signToken(payload, JWT_SECRET);
        }
    },

    decodeToken: (token: string) => {
        return jwt.decode(token);
    },
}

export default JWT;