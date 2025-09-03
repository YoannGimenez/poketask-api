import {NextFunction, Request, Response} from "express";
import {pokemonService} from "../service/pokemonService";

async function catchPokemon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { locationId, itemId, isShiny } = req.body;
        const userId = (req.user as { id: string }).id;
        const pokemonId = parseInt(req.params.id, 10);
        if (isNaN(pokemonId) || pokemonId <= 0) {
            res.status(400).json({
                success: false,
                error: 'ID de Pokémon invalide. Doit être un nombre positif.'
            });
            return;
        }

        const catchResult = await pokemonService.catchPokemon(pokemonId, locationId, itemId, userId, isShiny);
        res.status(200).json(catchResult);

    } catch (err) {
        next(err);
    }
}

async function getUserPokemons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as { id: string }).id;
        const userPokemons = await pokemonService.getUserPokemons(userId);
        res.status(200).json({ userPokemons });
    } catch (err) {
        next(err);
    }
}

export const pokemonController = {
    catchPokemon,
    getUserPokemons
};