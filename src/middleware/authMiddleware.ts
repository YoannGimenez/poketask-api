import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('jwt', { session: false }, (err: any, user: any, _info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next({
                status: 401,
                message: 'Token invalide ou expiré'
            });
        }
        req.user = user;
        next();
    })(req, res, next);
}
