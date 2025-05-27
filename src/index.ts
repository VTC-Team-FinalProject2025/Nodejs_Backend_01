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
import NotificationController from "./controllers/notification-controller";
import { db } from "./configs/firebase";
import ChannelController from "./controllers/channel-controller";
import UserController from "./controllers/user-controller";
import Chat1v1Repository from "./repositories/chat1v1Repository";
import Chat1v1Controller from "./controllers/message1v1-controller";
import ChatChannelRepository from "./repositories/chatChannelRepository";
import ChatMessageController from "./controllers/messagechanel-controller";
import { Server } from "http";
import RoleRepository from "./repositories/roleRepository";
import RoleController from "./controllers/role-controller";
import StoryController from './controllers/story-controller';
import StoryRepository from './repositories/storyRepository';
dotenv.config();

const port = process.env.PORT || 3000;
const prismaClient = new PrismaClient();
const userRepo = new UserRepository(prismaClient);
const friendShipRepo = new FriendShipRepository(prismaClient);
const serverRepo = new ServerRepository(prismaClient);
const channelRepo = new ChannelRepository(prismaClient, db);
const notiRepo = new NotificationRepository(prismaClient);
const chat1v1Repo = new Chat1v1Repository(prismaClient, db);
const roleRepo = new RoleRepository(prismaClient);
const chatChanelRepo = new ChatChannelRepository(prismaClient);
const storyRepo = new StoryRepository(prismaClient);

const app = new App(
  [
    new AuthController(userRepo, Passport),
    new UploadController(),
    new FriendShipController(
      friendShipRepo,
      prismaClient,
      db,
      notiRepo,
      userRepo,
    ),
    new ServerController(serverRepo, channelRepo, roleRepo, prismaClient, notiRepo),
    new NotificationController(notiRepo, prismaClient),
    new ChannelController(channelRepo, serverRepo, userRepo),
    new UserController(userRepo),
    new Chat1v1Controller(chat1v1Repo),
    new RoleController(roleRepo),
    new ChatMessageController(chatChanelRepo),
    new StoryController(storyRepo)
  ],
  port,
  notiRepo,
  chat1v1Repo,
  userRepo,
  chatChanelRepo
);

const apps: Server = app.listen();

export default apps;
