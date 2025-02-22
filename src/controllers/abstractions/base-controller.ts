import * as express from "express";
export abstract class BaseController {
  public router: express.Router;
  public path: string = "";
  constructor() {
    this.router = express.Router();
  }
  public abstract initializeRoutes(): void;
}
