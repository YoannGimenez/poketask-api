import prisma from '../lib/prisma';
import {Task, TaskStatus, TaskType} from "../../generated/prisma";
import { CreateTaskData } from '../utils/validationSchemas';
import { getStartOfDayInTimezone, getEndOfDayInTimezone, getStartOfWeekInTimezone, getEndOfWeekInTimezone } from '../utils/dateUtils';

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

async function completeTask(id: string, userId: string): Promise<Task> {
    const existingTask = await prisma.task.findFirst({
        where: { id, userId }
    });

    if (!existingTask) {
        throw new Error('Tâche non trouvée ou accès non autorisé');
    }

    return prisma.task.update({
        where: { id },
        data: { status: 'COMPLETED' }
    });
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


export const taskService = {
    getAll,
    getById,
    getMyTasks,
    create,
    update,
    remove,
    completeTask
};
