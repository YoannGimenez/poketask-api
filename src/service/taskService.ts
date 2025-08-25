import prisma from '../lib/prisma';
import {Task} from "../../generated/prisma";

async function getAll(): Promise<Task[]> {
    return prisma.task.findMany();
}

async function getById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
        where: { id },
    });
}

async function getAllByUser(userId: string): Promise<Task[]> {
    return prisma.task.findMany({
        where: { userId },
    });
}

async function create(data: Omit<Task, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Task> {
    return prisma.task.create({ 
        data: {
            ...data,
            userId: data.userId
        }
    });}

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
    getAllByUser,
    create,
    update,
    remove,
};
