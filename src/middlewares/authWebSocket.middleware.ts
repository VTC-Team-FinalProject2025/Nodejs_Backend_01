import { Socket } from "socket.io";
import HttpException from "../exceptions/http-exception";
import JWTHelper from "../helpers/JWT";

export default function authWebSocketMiddleware(
    socket: Socket, next: (err?: Error) => void
) {
    const token = socket.handshake.auth?.token;
    let tokenPayload;
    try{
        if (token) {
            tokenPayload = JWTHelper.verifyToken(token, "ACCESS");
            socket.data.userId = tokenPayload.userId;
            return next();
        }
    } catch (error: any) {
    }
    return next(new HttpException(401, "Unauthorized"));
}
