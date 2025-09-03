import { authenticateJWT } from '../middleware/authMiddleware';
import { Router } from 'express';
import {itemController} from "../controller/itemController";

const router = Router();

router.use(authenticateJWT);

router.get('/my-items', itemController.getUserItems);

export default router;
