import { Server } from "socket.io";
import { Server as HTTPServer } from "http";
import { WebSocketController } from "../controllers/websocket/WebSocketController";

class WebSocketServer {
  private io: Server;
  private controller: WebSocketController;

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: { 
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
        allowedHeaders: ["*"],
        credentials: true, 
      },
    });

    this.controller = new WebSocketController(this.io);
  }

  public broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }

  public sendToUser(socketId: string, event: string, data: any) {
    this.io.to(socketId).emit(event, data);
  }
}

export default WebSocketServer;