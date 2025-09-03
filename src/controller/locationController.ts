import {NextFunction, Request, Response} from "express";
import {locationService} from "../service/locationService";

async function encounterPokemon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const locationId = parseInt(req.params.id, 10);

        if (isNaN(locationId) || locationId <= 0) {
            res.status(400).json({ 
                success: false, 
                error: 'ID de localisation invalide. Doit être un nombre positif.' 
            });
            return;
        }

        const encounter = await locationService.encounterPokemon(locationId);
        res.status(200).json(encounter);
    } catch (err) {
        next(err);
    }
}

async function getUserLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as { id: string }).id;
        const userLocations = await locationService.getUserLocations(userId);
        res.status(200).json({ userLocations });
    } catch (err) {
        next(err);
    }
}

export const locationController = {
    encounterPokemon,
    getUserLocations
};