import dotenv from "dotenv";
import App from "./app";
import AuthController from "./controllers/auth-controller";
import UploadController from "./controllers/upload-controller"
import UserRepository from "./repositories/UserRepository";
import { PrismaClient } from "@prisma/client";
dotenv.config();

const port = process.env.PORT || 3000;
const prismaClient = new PrismaClient();
const userRepo = new UserRepository(prismaClient);
const app = new App([
    new AuthController(userRepo),
    new UploadController()
], port);

app.listen();
