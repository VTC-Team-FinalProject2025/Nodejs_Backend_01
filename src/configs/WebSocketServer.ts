import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { WebSocketController } from "../controllers/websocket/WebSocketController";
import {OnlineUserController} from  "../controllers/websocket/onlineUser-controller"
import authWebSocketMiddleware from "../middlewares/authWebSocket.middleware";
import { db } from "./firebase";

class WebSocketServer {
  private io: Server;
  private webSocketController: WebSocketController;
  private onlineUserController: OnlineUserController;

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: { 
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
        allowedHeaders: ["*"],
        credentials: true, 
      },
    });
    this.io.use(authWebSocketMiddleware); 
    this.webSocketController = new WebSocketController(this.io);
    this.onlineUserController = new OnlineUserController(this.io, db);
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  public sendToUser(socketId: string, event: string, data: any) {
    this.io.to(socketId).emit(event, data);
  }
}

export default WebSocketServer;