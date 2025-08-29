import { authenticateJWT } from '../middleware/authMiddleware';
import { router } from '../config/routerConfig';
import { validateParams } from '../middleware/validationMiddleware';
import {locationController} from "../controller/locationController";
import {locationIdSchema} from "../utils/validationSchemas";

router.use(authenticateJWT);

router.get('/:id/encounter', validateParams(locationIdSchema), locationController.encounterPokemon);

export default router;
