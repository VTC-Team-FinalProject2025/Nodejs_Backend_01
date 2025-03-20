import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { OnlineUserController } from "../controllers/websocket/onlineUser-controller";
import { Chat1v1Controller } from "../controllers/websocket/chat1v1-controller";
import {ChatChannelController} from '../controllers/websocket/chatChannel-controller';
import NotificationRepository from "../repositories/notificationRepository";
import { db } from "./firebase";
import Chat1v1Repository from "../repositories/chat1v1Repository";
import UserRepository from "../repositories/UserRepository";
import ChatChannelRepository from "../repositories/chatChannelRepository";

class WebSocketServer {
  private readonly io: Server;
  private readonly onlineUserController: OnlineUserController;
  private readonly chat1v1Controller: Chat1v1Controller;
  private readonly chatChannelController: ChatChannelController;

  constructor(httpServer: HTTPServer, notiRepo: NotificationRepository, chat1v1Repo: Chat1v1Repository, userRepo: UserRepository, chatChanelRepo:ChatChannelRepository) {
    this.io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["*"],
        credentials: true,
      },
    });
    this.onlineUserController = new OnlineUserController(this.io, db, notiRepo);
    this.chat1v1Controller = new Chat1v1Controller(this.io, db, chat1v1Repo,notiRepo, userRepo);
    this.chatChannelController = new ChatChannelController(this.io, chatChanelRepo, notiRepo);
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  public sendToUser(socketId: string, event: string, data: any) {
    this.io.to(socketId).emit(event, data);
  }
}

export default WebSocketServer;
