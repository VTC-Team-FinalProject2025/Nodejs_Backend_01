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
    this.router.post("/upload-media",
      this.upload.single("media"),
      this.uploadFileMedia,
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

  private readonly uploadFileMedia = async (
    request: express.Request,
    response: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      if (!request.file) {
        throw new FileUploadException("No file uploaded!");
      }
  
      const folderName = request.body.folderName;
      if (!folderName) {
        throw new FileUploadException("Missing folder name!");
      }
  
      const imageUrl = await this.fileRepository.uploadMedia(
        request.file,
        folderName,
      );
  
      response.json({
        message: "Photo uploaded successfully!",
        imageUrl,
      });
    } catch (error) {
      next(error);
    }
  };
}
