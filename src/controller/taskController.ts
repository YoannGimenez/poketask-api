import { taskService } from '../service/taskService';
import { Request, Response, NextFunction } from 'express';
import {User} from "../../generated/prisma";


async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const tasks = await taskService.getAll();
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
}

async function getMyTasks(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        const userId = (req.user as User).id;
        const tasks = await taskService.getMyTasks(userId);
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
}

async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const task = await taskService.getById(req.params.id);
        if (!task) res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (err) {
        next(err);
    }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as User).id;
        const taskData = { ...req.body };
        
        const task = await taskService.create(taskData, userId);
        res.status(201).json({ 
            message: 'Tâche créée avec succès',
            task 
        });
    } catch (err) {
        next(err);
    }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as User).id;
        const taskId = req.params.id;
        
        const existingTask = await taskService.getById(taskId);
        if (!existingTask || existingTask.userId !== userId) {
            res.status(403).json({ error: 'Accès non autorisé' });
            return;
        }
        
        const task = await taskService.update(taskId, req.body);        res.json(task);
    } catch (err) {
        next(err);
    }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        await taskService.remove(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

export const taskController = {
    getAll,
    getById,
    create,
    update,
    remove,
    getMyTasks
};
