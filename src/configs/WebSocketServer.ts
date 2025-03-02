import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { OnlineUserController } from "../controllers/websocket/onlineUser-controller";
import authWebSocketMiddleware from "../middlewares/authWebSocket.middleware";
import NotificationRepository from "../repositories/notificationRepository";
import { db } from "./firebase";

class WebSocketServer {
  private readonly io: Server;
  private readonly onlineUserController: OnlineUserController;

  constructor(httpServer: HTTPServer, notiRepo: NotificationRepository) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["*"],
        credentials: true,
      },
    });
    this.io.use(authWebSocketMiddleware);
    this.onlineUserController = new OnlineUserController(this.io, db, notiRepo);
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  public sendToUser(socketId: string, event: string, data: any) {
    this.io.to(socketId).emit(event, data);
  }
}

export default WebSocketServer;
