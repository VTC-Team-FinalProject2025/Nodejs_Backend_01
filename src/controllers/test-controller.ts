
import express from "express";
import { BaseController } from "./abstractions/base-controller";

export default class TestController extends BaseController {
  constructor() {
    super();
    this.path = "/test";
    this.initializeRoutes();
  }

  public initializeRoutes() {
    // không bao giờ vào được đây vì đã bị middleware chặn bởi controller 2 (controller 2 ở trước controller 1)
     this.router.get("/test-unauth2", () => {
        console.log("vào đây!");
    });
  }
}
