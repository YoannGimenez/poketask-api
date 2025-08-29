import { authController } from '../controller/authController';
import passport from 'passport';
import { validateData } from '../middleware/validationMiddleware';
import { loginSchema, registerSchema } from '../utils/validationSchemas';
import { router } from '../config/routerConfig';


router.post('/register', validateData(registerSchema), authController.register);

router.post('/login', validateData(loginSchema), authController.login);
router.get('/verify', authController.verifyToken);

router.get('/profile', 
    passport.authenticate('jwt', { session: false }), 
    authController.getProfile
);

export default router;
