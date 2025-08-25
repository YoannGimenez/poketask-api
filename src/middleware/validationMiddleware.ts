import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodType } from 'zod';

export function validateData(schema: ZodType) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.issues.map((issue) => ({
                    message: issue.message,
                }));

                res.status(400).json({
                    error: 'Invalid data',
                    details: errorMessages,
                });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }

        }
    };
}
