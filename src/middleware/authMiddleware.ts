import { Request, Response, NextFunction } from 'express';
import passport from 'passport';

// Middleware pour protéger les routes avec JWT
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }
        req.user = user;
        next();
    })(req, res, next);
}

// Middleware optionnel pour vérifier si l'utilisateur est connecté
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
}

export function checkOwnership(fieldName: string = 'userId') {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentification requise' });
            return;
        }
        
        const resourceUserId = req.params[fieldName] || req.body[fieldName];
        if (resourceUserId !== (req.user as any).id) {
            res.status(403).json({ error: 'Accès non autorisé' });
            return;
        }
        
        next();
    };
}