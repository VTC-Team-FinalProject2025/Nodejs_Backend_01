export default class FileUploadException extends Error {
    constructor(message: string) {
      super(message);
      this.name = "FileUploadException";
    }
  }