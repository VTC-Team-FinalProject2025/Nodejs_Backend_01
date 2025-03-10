import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { OnlineUserController } from "../controllers/websocket/onlineUser-controller";
import { Chat1v1Controller } from "../controllers/websocket/chat1v1-controller";
import NotificationRepository from "../repositories/notificationRepository";
import { db } from "./firebase";
import Chat1v1Repository from "../repositories/chat1v1Repository";

class WebSocketServer {
  private readonly io: Server;
  private readonly onlineUserController: OnlineUserController;
  private readonly chat1v1Controller: Chat1v1Controller;

  constructor(httpServer: HTTPServer, notiRepo: NotificationRepository, chat1v1Repo: Chat1v1Repository) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["*"],
        credentials: true,
      },
    });
    this.onlineUserController = new OnlineUserController(this.io, db, notiRepo, chat1v1Repo);
    this.chat1v1Controller = new Chat1v1Controller(this.io, db, chat1v1Repo,notiRepo);
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  public sendToUser(socketId: string, event: string, data: any) {
    this.io.to(socketId).emit(event, data);
  }
}

export default WebSocketServer;
