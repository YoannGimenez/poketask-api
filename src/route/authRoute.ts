import { Router } from 'express';
import { authController } from '../controller/authController';
import passport from 'passport';

const router = Router();

// Route d'inscription (pas d'authentification requise)
router.post('/register', authController.register);

// Route de connexion (pas d'authentification requise)
router.post('/login', authController.login);

// Route pour obtenir le profil (authentification JWT requise)
router.get('/profile', 
    passport.authenticate('jwt', { session: false }), 
    authController.getProfile
);

export default router;
