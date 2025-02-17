import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import HttpException from '../exceptions/http-exception';
const validateSchema = (schema: ZodSchema<any>): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            return next(new HttpException(400, err instanceof Error ? err.message : String(err)));
        }
    };
};

export default validateSchema;
