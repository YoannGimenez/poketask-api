import {validateParams} from "../middleware/validationMiddleware";
import {pokemonIdSchema} from "../utils/validationSchemas";
import {authenticateJWT} from "../middleware/authMiddleware";
import {pokemonController} from "../controller/pokemonController";
import { Router } from 'express';

const router = Router();

router.use(authenticateJWT);

router.post('/:id/catch', validateParams(pokemonIdSchema), pokemonController.catchPokemon);
router.get('/my-pokemons', pokemonController.getUserPokemons);
router.get('/starters', pokemonController.getStarters);
router.post('/add-starter', pokemonController.addPokemon);

export default router;
