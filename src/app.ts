import express from "express";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { BaseController } from "./controllers/abstractions/base-controller";
import errorMiddleware from "./middlewares/error.middleware";
import swaggerUi from "swagger-ui-express";
import { openapiSpecification } from "./configs/setUpSwagger";
import Passport from "./configs/auth/Passport";

class App {
  public app: express.Application;
  public port: number | string;

  constructor(controllers: BaseController[], port: number | string) {
    this.app = express();
    this.port = port;

    this.initializeMiddlewares();
    this.initializePassport();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    this.app.use(cookieParser());
    this.app.use(cors());
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
      this.app.use("/api", controller.router);
    });
  }

  private initializePassport() {
    // Initialize passport
    this.app.use(Passport.initialize());
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App listening on the port ${this.port}`);
    });
  }
}

export default App;
