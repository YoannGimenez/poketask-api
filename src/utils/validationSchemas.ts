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
    
    isDaily: z.boolean().optional(),
    isWeekly: z.boolean().optional(),
    isInfinite: z.boolean().optional(),
    amountToComplete: z.number()
        .int('Le montant doit être un nombre entier')
        .positive('Le montant doit être positif'),

    difficulty: z.enum(['EASY', 'NORMAL', 'HARD']).optional(),
    weeklyDays: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).optional()
});

export const updateTaskSchema = createTaskSchema.partial();

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateTaskData = z.infer<typeof createTaskSchema>;
export type UpdateTaskData = z.infer<typeof updateTaskSchema>;
