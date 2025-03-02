import express from "express";
import { BaseController } from "./abstractions/base-controller";
import { FileRepository } from "../repositories/fileRepository";
import FileUploadException from "../exceptions/file-upload-exception";
import multer from "multer";

export default class FileController extends BaseController {
  private readonly fileRepository: FileRepository;

  private readonly upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  constructor() {
    super();
    this.path = "/files";
    this.fileRepository = new FileRepository();
    this.initializeRoutes();
  }

  public initializeRoutes() {
    this.router.post("/upload",
      this.upload.single("image"),
      this.uploadFile,
    );
  }

  private readonly uploadFile = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      if (!request.file) {
        throw new FileUploadException("No files uploaded!");
      }

      const folderName =
        request.body.folderName || request.query.folderName || "uploads";

      const imageUrl = await this.fileRepository.uploadImage(
        request.file,
        folderName,
      );

      response.json({ message: "Photo uploaded successfully!", imageUrl });
    } catch (error) {
      next(error);
    }
  };
}
