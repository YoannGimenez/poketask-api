import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../generated/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

interface RegisterData {
    username: string;
    email: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

async function register(data: RegisterData): Promise<Omit<User, 'password'>> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email },
                { username: data.username }
            ]
        }
    });

    if (existingUser) {
        throw new Error('Un utilisateur avec cet email ou nom d\'utilisateur existe déjà');
    }

    // Hasher le mot de passe
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
        data: {
            username: data.username,
            email: data.email,
            password: hashedPassword,
        }
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

async function login(data: LoginData): Promise<{ user: Omit<User, 'password'>; token: string }> {
    // Trouver l'utilisateur par email
    const user = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (!user) {
        throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isValidPassword = bcrypt.compareSync(data.password, user.password);
    if (!isValidPassword) {
        throw new Error('Email ou mot de passe incorrect');
    }

    // Mettre à jour la dernière connexion
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
    });

    // Générer le token JWT
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Retourner l'utilisateur sans le mot de passe et le token
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
}

async function getProfile(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

export const authService = {
    register,
    login,
    getProfile
};
