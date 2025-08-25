import { Router } from 'express';
import { authController } from '../controller/authController';
import passport from 'passport';
import { validateData } from '../middleware/validationMiddleware';
import { loginSchema, registerSchema } from '../utils/validationSchemas';

const router = Router();

router.post('/register', validateData(registerSchema), authController.register);

router.post('/login', validateData(loginSchema), authController.login);

router.get('/profile', 
    passport.authenticate('jwt', { session: false }), 
    authController.getProfile
);

export default router;
