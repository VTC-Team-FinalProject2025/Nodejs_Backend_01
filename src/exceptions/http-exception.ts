type ResponseType = string | { message: string; code: string };

export default class HttpException extends Error {
  status: number;
  response: ResponseType;

  constructor(status: number, response: ResponseType) {
    const message = typeof response === "string" ? response : response.message;
    super(message);

    this.status = status;
    this.response = response;

    Object.setPrototypeOf(this, HttpException.prototype);
  }
}
