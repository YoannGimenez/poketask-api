import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {TaskStatus, User} from '../../generated/prisma';
import {ApiError} from "../utils/ApiError";

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

    const hashedPassword = bcrypt.hashSync(data.password, 10);

    const user = await prisma.user.create({
        data: {
            username: data.username,
            email: data.email,
            password: hashedPassword,
        }
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

async function login(data: LoginData): Promise<{ user: any; token: string }> {
    const user = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if (!user) {
        throw new ApiError(401, 'Email ou mot de passe incorrect', 'INVALID_CREDENTIALS');
    }

    const isValidPassword = bcrypt.compareSync(data.password, user.password);
    if (!isValidPassword) {
        throw new ApiError(401, 'Email ou mot de passe incorrect', 'INVALID_CREDENTIALS');
    }

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
    });

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    const completedTasksCount = await prisma.task.count({
        where: {
            userId: user.id,
            status: { in: [TaskStatus.COMPLETED, TaskStatus.TRUE_COMPLETED] }
        }
    });

    const pokemonsCount = await prisma.userPokemon.count({
        where: { userId: user.id }
    });

    const { password, ...userWithoutPassword } = user;
    return {
        user: {
            ...userWithoutPassword,
            completedTasksCount,
            pokemonsCount
        },
        token
    };
}

async function getProfile(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

async function verifyAndRefreshToken(token: string): Promise<{ user: any; token: string; isNew: boolean }> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }

        const now = Math.floor(Date.now() / 1000);
        const timeLeft = decoded.exp - now;
        
        const threeDaysInSeconds = 72 * 60 * 60;
        let isNew = false;
        let newToken = token;

        if (timeLeft < threeDaysInSeconds) {
            newToken = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            isNew = true;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const completedTasksCount = await prisma.task.count({
            where: {
                userId: user.id,
                status: { in: [TaskStatus.COMPLETED, TaskStatus.TRUE_COMPLETED] }
            }
        });

        const pokemonsCount = await prisma.userPokemon.count({
            where: { userId: user.id }
        });

        const { password, ...userWithoutPassword } = user;
        return {
            user: {
                ...userWithoutPassword,
                completedTasksCount,
                pokemonsCount
            },
            token: newToken,
            isNew
        };
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Token invalide');
        } else if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token expiré');
        }
        throw error;
    }
}

export const authService = {
    register,
    login,
    getProfile,
    verifyAndRefreshToken
};
