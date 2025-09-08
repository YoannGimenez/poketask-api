import { taskService } from '../service/taskService';
import { Request, Response, NextFunction } from 'express';
import {User} from "../../generated/prisma";


async function getMyTasks(req: Request, res: Response, next: NextFunction): Promise<void>{
    try {
        const userId = (req.user as User).id;
        const tasks = await taskService.getMyTasks(userId);
        res.status(200).json({ success: true, tasks });
    } catch (err) {
        next(err);
    }
}

async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        console.log("Creating task with data:", req.body);
        const userId = (req.user as User).id;
        const taskData = { ...req.body };
        
        const task = await taskService.create(taskData, userId);
        res.status(201).json({
            success: true,
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
        const updateData = req.body;
        
        const updatedTask = await taskService.update(taskId, updateData, userId);
        
        res.status(200).json({
            success: true,
            message: 'Tâche mise à jour avec succès',
            task: updatedTask
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.includes('non trouvée')) {
                res.status(404).json({ 
                    success: false, 
                    error: err.message 
                });
            } else if (err.message.includes('Impossible de modifier')) {
                res.status(400).json({ 
                    success: false, 
                    error: err.message 
                });
            } else if (err.message.includes('accès non autorisé')) {
                res.status(403).json({ 
                    success: false, 
                    error: err.message 
                });
            } else if (err.message.includes('Erreur lors de la mise à jour')) {
                res.status(500).json({ 
                    success: false, 
                    error: err.message 
                });
            } else {
                res.status(400).json({ 
                    success: false, 
                    error: err.message 
                });
            }
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Erreur interne du serveur' 
            });
        }
    }
}

async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as User).id;
        const taskId = req.params.id;
        
        const result = await taskService.remove(taskId, userId);
        
        res.status(200).json({
            success: result.success,
            message: result.message
        });
    } catch (err) {
        if (err instanceof Error) {
            if (err.message.includes('non trouvée')) {
                res.status(404).json({ 
                    success: false, 
                    error: err.message 
                });
            } else if (err.message.includes('Impossible de supprimer')) {
                res.status(400).json({ 
                    success: false, 
                    error: err.message 
                });
            } else if (err.message.includes('accès non autorisé')) {
                res.status(403).json({ 
                    success: false, 
                    error: err.message 
                });
            } else {
                res.status(500).json({ 
                    success: false, 
                    error: err.message 
                });
            }
        } else {
            res.status(500).json({ 
                success: false, 
                error: 'Erreur interne du serveur' 
            });
        }
    }
}

async function completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as User).id;
        const taskId = req.params.id;

        const task = await taskService.completeTask(taskId, userId);
        res.status(200).json({
            success: true,
            message: 'Tâche marquée comme complétée',
            user: task.user,
            task: task.completedTask
        });
    } catch (err) {
        next(err);
    }
}

export const taskController = {
    create,
    update,
    remove,
    getMyTasks,
    completeTask
};
