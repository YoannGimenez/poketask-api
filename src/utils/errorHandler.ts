import { Prisma } from '../../generated/prisma';
import { Request, Response } from 'express';
import { formatDate } from './formatDate';

const getPrismaErrorMessage = (error: Prisma.PrismaClientKnownRequestError) => {

    switch (error.code) {

        // Unique constraint
        case 'P2002':
            const field = error.meta?.target || 'inconnu';
            return { status: 400, message: `Erreur : le champ ${field} doit être unique. La valeur fournie est déjà utilisée.` };

        // Foreign key constraint
        case 'P2003':
            return { status: 400, message: "Erreur : violation de contrainte de clé étrangère. Veuillez vérifier les références." };

        case 'P2025':
            return { status: 404, message: "Erreur : Une opération a échoué car elle dépend d'un ou plusieurs enregistrements requis mais introuvables." };

        // Default error
        default:
            return { status: 500, message: "Erreur serveur : une erreur Prisma inconnue s'est produite." };
    }
}

const formatValidationErrors = (error: { status: number, error: { field: string, message: string }[] }): { status: number, error: { field: string, message: string }[] } => {
    return { status: error.status, error: error.error };
}

/**
 * Throws an error with a status code and an error message.
 * @param status - The status code to throw.
 * @param message - The error message to throw.
 * @throws An error object with the given status code and error message.
 */
export const throwError = (status: number, message: string) => {
    throw {
        status,
        error: { message },
    }
};

/**
 * Logs an error message with a specified type, request details, and optional additional error message.
 *
 * @param type - The type of error (e.g., "ERROR", "WARNING").
 * @param _req - The Express request object, used to retrieve method and URL.
 * @param message - A descriptive error message to be logged.
 * @param errorMessage - An optional additional error message for further context.
 */
const logError = (type: string, _req: Request, message: string, errorMessage?: string): void => {

    // Format Date
    const dateFormated = formatDate(new Date());

    // Returns an error in the logs
    console.error(`[${dateFormated}] ${type} : ${message} ${errorMessage ? '| ' + errorMessage : ''}`);
    // logger.error(`Method: ${req.method}, Path: ${req.originalUrl}  ${type} : ${message} ${errorMessage ? '| ' + errorMessage : ''}`);
}

/**
 * Sends an error response to the client with the given status code and error message.
 * @param res - The Express response object.
 * @param status - The status code to send in the response.
 * @param error - A string or an array of objects containing 'field' and 'message' properties, each representing a validation error.
 */
const sendErrorResponse = (res: Response, status: number, error: string | { field: string, message: string }[]): void => {
    res.status(status).json({ status, error });
}

/**
 * Handles an error by logging it and sending an appropriate error response to the client.
 *
 * Handles three types of errors:
 *   1. Prisma errors: logs the error with the type 'Erreur Prisma' and sends a 400 response with a custom error message.
 *   2. Validation errors: logs the error with the type 'Erreur de validation' and sends a 400 response with an array of validation errors.
 *   3. Server errors: logs the error with the type 'Erreur serveur' and sends a 500 response with the error message.
 *   4. Unknown errors: logs the error with the type 'Erreur inconnue' and sends a 500 response with a default error message.
 *
 * @param error - The error to handle.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param errorMessage - An optional additional error message to log.
 */
export const handleError = (error: unknown, req: Request, res: Response, errorMessage?: string): void => {

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {

        // Send an error with a custom error message
        const errorPrisma = getPrismaErrorMessage(error);

        // Log the error
        logError('Erreur Prisma', req, errorPrisma.message, errorMessage);

        // Send a 400 error with a custom error message
        sendErrorResponse(res, errorPrisma.status, errorPrisma.message);

        // Handle validation errors
    } else if (typeof error === 'object' && error !== null && 'status' in error) {

        // Format the validation errors
        const validationError = formatValidationErrors(error as { status: number, error: { field: string, message: string }[] });

        logError('Erreur de validation', req, JSON.stringify(validationError.error), errorMessage);

        // Send a 400 error with an array of validation errors
        sendErrorResponse(res, validationError.status, validationError.error);

        // Handle server errors
    } else if (error instanceof Error) {

        // Log the error
        logError('Erreur serveur', req, error.message, errorMessage);

        // Send a 500 error with the error message
        sendErrorResponse(res, 500, error.message);

        // Handle unknown errors
    } else {

        // Log the error
        logError('Erreur inconnue', req, 'Erreur serveur inconnue', errorMessage);

        // Send a 500 error with a default error message
        sendErrorResponse(res, 500, 'Erreur serveur inconnue');
    }
};