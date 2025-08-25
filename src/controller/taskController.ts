import { taskService } from '../service/taskService';
import { Request, Response, NextFunction } from 'express';


async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const tasks = await taskService.getAll();
        res.status(200).json(tasks);
    } catch (err) {
        next(err);
    }
}

async function getAllByUser(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        const tasks = await taskService.getAllByUser(req.params.userId);
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
        const userId = (req.user as any).id;
        const taskData = { ...req.body, userId };
        
        const task = await taskService.create(taskData);        res.status(201).json(task);
    } catch (err) {
        next(err);
    }
}

async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as any).id;
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
    getAllByUser
};
