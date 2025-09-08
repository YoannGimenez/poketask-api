import { ApiError } from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
    console.error(err);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                code: err.code ?? "UNKNOWN_ERROR",
            },
        });
    }

    return res.status(500).json({
        success: false,
        error: {
            message: "Erreur interne du serveur",
            code: "INTERNAL_SERVER_ERROR",
        },
    });
}
