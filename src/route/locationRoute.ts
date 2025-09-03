import { authenticateJWT } from '../middleware/authMiddleware';
import { validateParams } from '../middleware/validationMiddleware';
import {locationController} from "../controller/locationController";
import {locationIdSchema} from "../utils/validationSchemas";
import { Router } from 'express';

const router = Router();

router.use(authenticateJWT);

router.get('/:id/encounter', validateParams(locationIdSchema), locationController.encounterPokemon);
router.get('/my-locations', locationController.getUserLocations);

export default router;
