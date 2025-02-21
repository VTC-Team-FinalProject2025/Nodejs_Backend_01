import dotenv from "dotenv";
import App from "./app";
import AuthController from "./controllers/auth-controller";
import UploadController from "./controllers/upload-controller";
import UserRepository from "./repositories/UserRepository";
import { PrismaClient } from "@prisma/client";
import Passport from "./configs/auth/Passport";
import FriendShipController from "./controllers/friend-controller";
import FriendShipRepository from "./repositories/FriendRepository";
dotenv.config();

const port = process.env.PORT || 3000;
const prismaClient = new PrismaClient();
const userRepo = new UserRepository(prismaClient);
const friendShipRepo = new FriendShipRepository(prismaClient);
const app = new App(
  [
    new AuthController(userRepo, Passport),
    new UploadController(),
    new FriendShipController(friendShipRepo, prismaClient),
  ], port);
app.listen();
