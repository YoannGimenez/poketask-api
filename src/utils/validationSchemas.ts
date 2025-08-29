import { z } from 'zod';
import {TaskDifficulty, TaskStatus, TaskType} from "../../generated/prisma";

export const registerSchema = z.object({
    username: z.string()
        .min(2, 'Le nom d\'utilisateur doit contenir au moins 2 caractères')
        .max(20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
    
    email: z.email('Format d\'email invalide'),
    
    password: z.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
});

export const loginSchema = z.object({
    email: z.email('Format d\'email invalide'),
    
    password: z.string()
        .min(1, 'Le mot de passe est requis')
});

export const dateSchema = z.preprocess(
    (arg) => (typeof arg === "string" ? new Date(arg) : arg),
    z.date().nullable()
);

export const createTaskSchema = z.object({
    title: z.string()
        .min(1, 'Le titre est requis')
        .max(50, 'Le titre ne peut pas dépasser 50 caractères'),
    
    description: z.string()
        .min(1, 'La description est requise')
        .max(100, 'La description ne peut pas dépasser 100 caractères'),
    
    status: z.enum([TaskStatus.PENDING, TaskStatus.COMPLETED, TaskStatus.TRUE_COMPLETED, TaskStatus.DELETED, TaskStatus.EXPIRED]).default(TaskStatus.PENDING),
    type: z.enum([TaskType.DAILY, TaskType.WEEKLY, TaskType.ONE_TIME, TaskType.REPEATABLE]).default(TaskType.DAILY),
    difficulty: z.enum([TaskDifficulty.EASY, TaskDifficulty.NORMAL, TaskDifficulty.HARD]).default(TaskDifficulty.EASY),
    timezone: z.string().default('UTC'),
    dateStart: dateSchema,
    dateEnd: dateSchema
});

export const taskIdSchema = z.object({
    id: z.uuid('ID de tâche invalide')
});

export const userIdSchema = z.object({
    id: z.uuid('ID d\'utilisateur invalide')
});

export const locationIdSchema = z.object({
    id: z.string('ID de localisation invalide')
});

export const pokemonIdSchema = z.object({
    id: z.string('ID de pokémon invalide')
});

export const updateTaskSchema = createTaskSchema.partial();

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type TaskIdParams = z.infer<typeof taskIdSchema>;
export type UserIdParams = z.infer<typeof userIdSchema>;
export type LocationIdParams = z.infer<typeof locationIdSchema>;
export type PokemonIdParams = z.infer<typeof pokemonIdSchema>;
