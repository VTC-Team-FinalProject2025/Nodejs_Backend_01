import { bucket } from "../configs/firebase";
import sharp from "sharp";

export class FileRepository {
    public async uploadImage(file: Express.Multer.File, folderName: string): Promise<string> {
      return new Promise(async (resolve, reject) => {
        if (!file) {
          return reject(new Error("Không có tệp nào được tải lên!"));
        }
  
        try {
          const originalFormat = file.mimetype.split("/")[1];
  
          const fileName = `${folderName}/${Date.now()}.${originalFormat}`;
          const fileRef = bucket.file(fileName);

          const image = sharp(file.buffer);
          const metadata = await image.metadata();
  
          if (metadata.width && metadata.width > 2000) {
            image.resize({ width: 2000 });
          }
  
          let processedImage = image;
          if (originalFormat === "jpeg" || originalFormat === "jpg") {
            processedImage.jpeg({ mozjpeg: true }); 
          } else if (originalFormat === "png") {
            processedImage.png({ compressionLevel: 0 }); 
          } else if (originalFormat === "webp") {
            processedImage.webp({ quality: 100 });
          }
  
          const finalBuffer = await processedImage.toBuffer();
  
          const stream = fileRef.createWriteStream({
            metadata: { contentType: file.mimetype },
          });
  
          stream.on("error", (err) => reject(err));
  
          stream.on("finish", async () => {
            await fileRef.makePublic();
            resolve(`https://storage.googleapis.com/${bucket.name}/${fileName}`);
          });
  
          stream.end(finalBuffer);
        } catch (error) {
          reject(error);
        }
      });
    }
  }
