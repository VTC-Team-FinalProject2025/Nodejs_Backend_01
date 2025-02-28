import express from "express";
import { BaseController } from "./abstractions/base-controller";
import NotificationRepository from "../repositories/notificationRepository";
import paginate from "../helpers/Pagination";
import { PrismaClient } from "@prisma/client";
import authMiddleware from "../middlewares/authentication.middleware";

export default class NotificationController extends BaseController {
    private notiRepo: NotificationRepository;
    private prisma: PrismaClient;

    constructor(notiRepo: NotificationRepository, prisma: PrismaClient) {
        super();
        this.path = "/notification";
        this.notiRepo = notiRepo;
        this.prisma = prisma;
        this.initializeRoutes();
    }

    public initializeRoutes() {
        this.router.use(authMiddleware);
        this.router.get("/", this.ShowNotification);
    }

    private ShowNotification = async (
        request: express.Request,
        response: express.Response,
        next: express.NextFunction,
    ) => {
        try {
            const { userId } = request.user;
            const { page = 1, limit = 10, search } = request.query;

            const filterCondition = {
                OR: [
                    {
                        userId: Number(userId),
                    },
                ],
            }

            const result = await paginate(
                this.prisma.notification,
                Number(page),
                Number(limit),
                filterCondition,
                {},
                { createdAt: "desc" }
            );
            response.json(result);
        } catch (error) {
            next(error);
        }
    };
}
