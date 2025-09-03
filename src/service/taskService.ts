import prisma from '../lib/prisma';
import {Task, TaskDifficulty, TaskStatus, TaskType, User} from "../../generated/prisma";
import { CreateTaskData } from '../utils/validationSchemas';
import { getStartOfDayInTimezone, getEndOfDayInTimezone, getStartOfWeekInTimezone, getEndOfWeekInTimezone } from '../utils/dateUtils';
import {pokemonService} from "./pokemonService";

async function getAll(): Promise<Task[]> {
    return prisma.task.findMany();
}

async function getById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
        where: { id },
    });
}

async function getMyTasks(userId: string): Promise<Task[]> {
    return prisma.task.findMany({
        where: {
            userId,
            status: {
                in: [TaskStatus.PENDING, TaskStatus.COMPLETED],
            },
        },
    });
}

async function completeTask(id: string, userId: string): Promise<any> {
    const existingTask = await prisma.task.findFirst({
        where: { id, userId },
        include: {
            user: true
        }
    });

    if (!existingTask) {
        throw new Error('Tâche non trouvée ou accès non autorisé');
    }

    if (existingTask.status === TaskStatus.COMPLETED || existingTask.status === TaskStatus.TRUE_COMPLETED) {
        throw new Error('Tâche déjà complétée');
    }

    let newStatus: TaskStatus = TaskStatus.COMPLETED;

    if (existingTask.type === TaskType.REPEATABLE || existingTask.type === TaskType.ONE_TIME) {
        newStatus = TaskStatus.TRUE_COMPLETED;
    }

    const completedTask = await prisma.task.update({
        where: { id },
        data: { status: newStatus }
    });

    if (existingTask.type === TaskType.REPEATABLE) {
        await prisma.task.create({
            data: {
                title: existingTask.title,
                description: existingTask.description,
                status: TaskStatus.PENDING,
                type: existingTask.type,
                difficulty: existingTask.difficulty,
                timezone: existingTask.timezone,
                userId: existingTask.userId,
                dateStart: getStartOfDayInTimezone(existingTask.timezone),
            }
        });
    }

    const updatedUser = await gainExperience(existingTask.user, existingTask.difficulty)

    return {
        completedTask: completedTask,
        user: updatedUser
    }
}

async function create(data: CreateTaskData, userId: string): Promise<Task> {

    let dateStart: Date | null = null;
    let dateEnd: Date | null = null;

    const timezone = data.timezone


    if (data.dateStart && data.dateEnd) {
        dateStart = new Date(data.dateStart);
        dateEnd = new Date(data.dateEnd);
    } else {
        switch(data.type) {
            case TaskType.DAILY:
                dateStart = getStartOfDayInTimezone(timezone);
                dateEnd = getEndOfDayInTimezone(timezone);
                break;
                
            case TaskType.WEEKLY:
                dateStart = getStartOfWeekInTimezone(timezone);
                dateEnd = getEndOfWeekInTimezone(timezone);
                break;
                
            case TaskType.REPEATABLE:
                dateStart = getStartOfDayInTimezone(timezone);
                break;
                
            case TaskType.ONE_TIME:
                break;
                
            default:
                throw new Error('Type de tâche invalide');
        }
    }

    return prisma.task.create({
        data: {
            ...data,
            userId: userId,
            dateStart: dateStart,
            dateEnd: dateEnd,
            timezone: timezone
        }
    });
}

async function update(id: string, data: Partial<CreateTaskData>, userId: string): Promise<{ success: boolean; message: string; task: Task }> {
    const existingTask = await prisma.task.findFirst({
        where: { id, userId },
        select: { id: true, title: true, status: true, type: true, timezone: true }
    });

    if (!existingTask) {
        throw new Error('Tâche non trouvée ou accès non autorisé');
    }

    const updateData: any = { ...data };

    // Il faut recalculer les dates si le type ou le timezone change
    if ((data.type && data.type !== existingTask.type) || (data.timezone && data.timezone !== existingTask.timezone)) {
        const newTimezone = data.timezone || existingTask.timezone;
        
        switch(data.type) {
            case TaskType.DAILY:
                updateData.dateStart = getStartOfDayInTimezone(newTimezone);
                updateData.dateEnd = getEndOfDayInTimezone(newTimezone);
                break;
            case TaskType.WEEKLY:
                updateData.dateStart = getStartOfWeekInTimezone(newTimezone);
                updateData.dateEnd = getEndOfWeekInTimezone(newTimezone);
                break;
            case TaskType.REPEATABLE:
                updateData.dateStart = getStartOfDayInTimezone(newTimezone);
                break;
            case TaskType.ONE_TIME:
                break;
            default:
                throw new Error('Type de tâche invalide');
        }
    }

    try {
        const updatedTask = await prisma.task.update({
            where: { id },
            data: updateData
        });

        return {
            success: true,
            message: `Tâche "${existingTask.title}" mise à jour avec succès`,
            task: updatedTask
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Erreur lors de la mise à jour : ${error.message}`);
        }
        throw new Error('Erreur inconnue lors de la mise à jour');
    }
}

async function remove(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const existingTask = await prisma.task.findFirst({
        where: { id, userId },
        select: { id: true, title: true, status: true }
    });

    if (!existingTask) {
        throw new Error('Tâche non trouvée ou accès non autorisé');
    }

    try {
        await prisma.task.delete({
            where: { id }
        });

        return {
            success: true,
            message: `Tâche "${existingTask.title}" supprimée avec succès`
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Erreur lors de la suppression : ${error.message}`);
        }
        throw new Error('Erreur inconnue lors de la suppression');
    }
}

async function gainExperience(user: User, taskDifficulty: TaskDifficulty): Promise<{}> {

    let experienceGain: number;
    switch (taskDifficulty) {
        case TaskDifficulty.EASY:
            experienceGain = 25;
            break;
        case TaskDifficulty.NORMAL:
            experienceGain = 100;
            break;
        case TaskDifficulty.HARD:
            experienceGain = 250;
            break;
        default:
            experienceGain = 0;
    }

    const { newExperience, newLevel, newNextLevelExp, leveledUp } = calculateLevelProgression(user, experienceGain);

    const updateData: any = {
        experience: newExperience,
    };

    if (leveledUp) {
        updateData.level = newLevel;
        updateData.nextLevelExperience = newNextLevelExp;
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
    });

    let evolvedPokemons: { basePokemonName: string; evolvedPokemonName: string; evolvedPokemonSpriteUrl: string; }[] = [];
    if (leveledUp) {
        evolvedPokemons = await pokemonService.checkForEvolutions(updatedUser);
    }

    return {
        leveledUp,
        updatedUser,
        evolvedPokemons
    };
}

function calculateLevelProgression(user: User, experienceGain: number): any {
    let newExperience = user.experience + experienceGain;
    let newLevel = user.level;
    let nextLevelExp = user.nextLevelExperience;
    let leveledUp = false;

    while (newExperience >= nextLevelExp) {
        newExperience -= nextLevelExp;
        newLevel += 1;
        nextLevelExp = Math.floor(nextLevelExp * 1.5);
        leveledUp = true;
    }

    return {
        newExperience,
        newLevel,
        newNextLevelExp: nextLevelExp,
        leveledUp,
    };
}


export const taskService = {
    getAll,
    getById,
    getMyTasks,
    create,
    update,
    remove,
    completeTask,
};
