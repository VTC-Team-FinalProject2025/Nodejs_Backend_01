import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { BaseController } from "./controllers/abstractions/base-controller";
import errorMiddleware from "./middlewares/error.middleware";
import swaggerUi from "swagger-ui-express";
import { openapiSpecification } from "./configs/setUpSwagger";
import Passport from "./configs/auth/Passport";
import { createServer, Server as HTTPServer } from "http";
import WebSocketServer from "./configs/WebSocketServer";
import { URL_CLIENT } from "./constants";

class App {
  public app: express.Application;
  public port: number | string;
  private httpServer: HTTPServer;
  private websocketServer: WebSocketServer;

  constructor(controllers: BaseController[], port: number | string) {
    this.app = express();
    this.port = port;
    this.httpServer = createServer(this.app);

    this.initializeMiddlewares();
    this.initializePassport();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();

    this.websocketServer = new WebSocketServer(this.httpServer);
  }

  private initializeMiddlewares() {
    this.app.use(cookieParser());
    this.app.use(cors(
      {
        origin: URL_CLIENT, // Domain frontend
        credentials: true, // Cho phép gửi cookie và header Authorization
      }
    ));
    this.app.use(express.json());
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: BaseController[]) {
    this.app.get("/", (request, response) => {
      response.send("Application is running");
    });
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(openapiSpecification),
    );
    controllers.forEach((controller) => {
      this.app.use("/api" + controller.path, controller.router);
    });
  }

  private initializePassport() {
    // Initialize passport
    this.app.use(Passport.initialize());
  }

  public listen() {
    this.httpServer.listen(this.port, () => {
      console.log(`🚀 Server listening on port ${this.port}`);
    });
  }

  public getWebSocketServer(): WebSocketServer {
    return this.websocketServer;
  }
}

export default App;
