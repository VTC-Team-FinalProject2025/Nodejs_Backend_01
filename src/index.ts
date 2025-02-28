import dotenv from "dotenv";
import App from "./app";
import AuthController from "./controllers/auth-controller";
import UploadController from "./controllers/upload-controller";
import UserRepository from "./repositories/UserRepository";
import ServerController from "./controllers/server-controller";
import { PrismaClient } from "@prisma/client";
import Passport from "./configs/auth/Passport";
import FriendShipController from "./controllers/friend-controller";
import FriendShipRepository from "./repositories/FriendRepository";
import ServerRepository from "./repositories/serverRepository";
import ChannelRepository from "./repositories/channelRepository";
import NotificationRepository from "./repositories/notificationRepository";
import NotificationController from './controllers/notification-controller'
import { db } from "./configs/firebase";
import ChannelController from "./controllers/channel-controller";
dotenv.config();

const port = process.env.PORT || 3000;
const prismaClient = new PrismaClient();
const userRepo = new UserRepository(prismaClient);
const friendShipRepo = new FriendShipRepository(prismaClient);
const serverRepo = new ServerRepository(prismaClient);
const channelRepo = new ChannelRepository(prismaClient);
const notiRepo = new NotificationRepository(prismaClient);
const app = new App(
  [
    new AuthController(userRepo, Passport),
    new UploadController(),
    new FriendShipController(friendShipRepo, prismaClient, db, notiRepo),
    new ServerController(serverRepo, channelRepo, prismaClient),
    new NotificationController(notiRepo,prismaClient),
    new ChannelController(channelRepo, serverRepo),
  ],
  port,
  notiRepo,
);

app.listen();
