import { bucket } from "../configs/firebase";
import sharp from "sharp";

export class FileRepository {
  public async uploadImage(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error("Không có tệp nào được tải lên!"));
      }

      try {
        const originalFormat = file.mimetype.split("/")[1];
        const fileName = `${folderName}/${Date.now()}.${originalFormat}`;
        const fileRef = bucket.file(fileName);

        const image = sharp(file.buffer);

        image
          .metadata()
          .then((metadata) => {
            if (metadata.width && metadata.width > 2000) {
              image.resize({ width: 2000 });
            }

            if (originalFormat === "jpeg" || originalFormat === "jpg") {
              image.jpeg({ mozjpeg: true });
            } else if (originalFormat === "png") {
              image.png({ compressionLevel: 0 });
            } else if (originalFormat === "webp") {
              image.webp({ quality: 100 });
            }

            return image.toBuffer();
          })
          .then((finalBuffer) => {
            const stream = fileRef.createWriteStream({
              metadata: { contentType: file.mimetype },
            });

            stream.on("error", reject);
            stream.on("finish", async () => {
              await fileRef.makePublic();
              resolve(
                `https://storage.googleapis.com/${bucket.name}/${fileName}`,
              );
            });

            stream.end(finalBuffer);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}
