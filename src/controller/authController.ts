import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/authService';

async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { username, email, password } = req.body;

        // Validation basique
        if (!username || !email || !password) {
            res.status(400).json({ error: 'Tous les champs sont requis' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
            return;
        }

        const user = await authService.register({ username, email, password });
        res.status(201).json({ 
            message: 'Utilisateur créé avec succès',
            user 
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        } else {
            next(err);
        }
    }
}

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { email, password } = req.body;
        console.log("Login attempt:", email);

        if (!email || !password) {
            res.status(400).json({ error: 'Email et mot de passe requis' });
            return;
        }

        const result = await authService.login({ email, password });
        res.status(200).json({
            message: 'Connexion réussie',
            user: result.user,
            token: result.token
        });
    } catch (err) {
        if (err instanceof Error) {
            res.status(401).json({ error: err.message });
        } else {
            next(err);
        }
    }
}

async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // req.user est défini par Passport
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

export const authController = {
    register,
    login,
    getProfile
};
