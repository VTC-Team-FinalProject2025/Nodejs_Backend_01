import { Server, Socket } from "socket.io";

export class WebSocketController {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`🔗 Client connected: ${socket.data.userId}`);

      socket.on("message", (message) => this.handleMessage(socket, message));

      socket.on("disconnect", () => this.handleDisconnect(socket));
    });
  }

  private handleMessage(socket: Socket, message: string) {
    console.log(`📩 Received from ${socket.id}: ${message}`);

    this.io.emit("response", { from: socket.id, message });
  }

  private handleDisconnect(socket: Socket) {
    console.log(`❌ Client disconnected: ${socket.id}`);
  }
}