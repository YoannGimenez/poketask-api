import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/authService';
import {addLog} from "../utils/logger";

async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            await addLog('/api/auth/register', false, req.body, undefined, 'Champs manquants');
            res.status(400).json({ error: 'Tous les champs sont requis' });
            return;
        }

        if (password.length < 6) {
            await addLog('/api/auth/register', false, req.body, undefined, 'Mot de passe trop court');
            res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
            return;
        }

        const result = await authService.register({ username, email, password });
        res.status(201).json({ 
            message: 'Utilisateur créé avec succès',
            user : result.user,
            token: result.token
        });
    } catch (err) {
        next(err);
    }
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;

        const result = await authService.login({ email, password });

        res.status(200).json({
            message: 'Connexion réussie',
            user: result.user,
            token: result.token
        });
    } catch (err) {
        next(err);
    }
}

async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as any).id;
        const user = await authService.getProfile(userId);
        
        if (!user) {
            res.status(404).json({ error: 'Utilisateur non trouvé' });
            return;
        }

        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
}

async function verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Token d\'authentification requis' });
            return;
        }

        const token = authHeader.substring(7);
        
        if (!token) {
            res.status(401).json({ error: 'Token invalide' });
            return;
        }

        const result = await authService.verifyAndRefreshToken(token);
        
        res.status(200).json({
            message: result.isNew ? 'Token renouvelé' : 'Token valide',
            user: result.user,
            token: result.token,
            isNew: result.isNew
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(401).json({ error: err.message });
        } else {
            next(err);
        }
    }
}

export const authController = {
    register,
    login,
    getProfile,
    verifyToken
};
