import prisma from '../lib/prisma';
import {$Enums, Task} from "../../generated/prisma";
import { CreateTaskData } from '../utils/validationSchemas';
import { getStartOfDayInTimezone, getEndOfDayInTimezone, getStartOfWeekInTimezone, getEndOfWeekInTimezone } from '../utils/dateUtils';
import TaskType = $Enums.TaskType;

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
        where: { userId },
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

async function update(id: string, data: Partial<Task>): Promise<Task> {
    return prisma.task.update({
        where: { id },
        data,
    });
}

async function remove(id: string): Promise<Task> {
    return prisma.task.delete({
        where: { id },
    });
}


export const taskService = {
    getAll,
    getById,
    getMyTasks,
    create,
    update,
    remove
};
