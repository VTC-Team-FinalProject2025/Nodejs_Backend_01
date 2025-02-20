
import express from "express";
import { BaseController } from "./abstractions/base-controller";
import { AuthMiddleware } from "../middlewares/authentication.middleware";

export default class TestController extends BaseController {
  constructor() {
    super();
    this.path = "/test2";
    this.initializeRoutes();
  }

  public initializeRoutes() {
     this.router.get("/test-unauth", () => {
        console.log("UnAuthenticated!");
    });
    this.router.use(AuthMiddleware);
    this.router.get("/test-auth", () => {
        console.log("Authenticated!");
    });
  }
}
