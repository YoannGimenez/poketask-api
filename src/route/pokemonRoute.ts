import {router} from "../config/routerConfig";
import {validateParams} from "../middleware/validationMiddleware";
import {pokemonIdSchema} from "../utils/validationSchemas";
import {authenticateJWT} from "../middleware/authMiddleware";
import {pokemonController} from "../controller/pokemonController";

router.use(authenticateJWT);

router.post('/:id/catch', validateParams(pokemonIdSchema), pokemonController.catchPokemon);

export default router;
