import { Request, Response, NextFunction } from 'express';
import {addLog} from "../utils/logger";

export const logRequest = (req: Request, res: Response, next: NextFunction) => {

    const originalSend = res.send.bind(res);

    res.send = function (body?: any) {
        const success = res.statusCode < 400;
        const userId = (req.user as any)?.id;

        addLog(
            req.originalUrl,
            req.method,
            success,
            body,
            userId,
            success ? undefined : body
        ).catch(console.error);
        return originalSend(body);
    };

    next();
};
