import { z } from 'zod';

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

export const createTaskSchema = z.object({
    title: z.string()
        .min(1, 'Le titre est requis')
        .max(50, 'Le titre ne peut pas dépasser 50 caractères'),
    
    description: z.string()
        .min(1, 'La description est requise')
        .max(100, 'La description ne peut pas dépasser 100 caractères'),
    
    status: z.enum(['PENDING', 'COMPLETED', 'TRUE_COMPLETED', 'DELETED', 'EXPIRED']).default('PENDING'),
    type: z.enum(['DAILY', 'WEEKLY', 'ONE_TIME', 'REPEATABLE']).default('DAILY'),
    difficulty: z.enum(['EASY', 'NORMAL', 'HARD']).default('NORMAL'),
    timezone: z.string().default('UTC'),
    dateStart: z.date().optional(),
    dateEnd: z.date().optional()
});

export const taskIdSchema = z.object({
    id: z.uuid('ID de tâche invalide')
});

export const userIdSchema = z.object({
    id: z.uuid('ID d\'utilisateur invalide')
});

export const updateTaskSchema = createTaskSchema.partial();

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
export type TaskIdParams = z.infer<typeof taskIdSchema>;
export type UserIdParams = z.infer<typeof userIdSchema>;
