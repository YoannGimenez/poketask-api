import prisma from '../lib/prisma';
import { calculateNewTaskDates, shouldRecreateTask } from '../utils/dateUtils';
import { taskService } from './taskService';
import {TaskStatus, TaskType} from "../../generated/prisma";

const BATCH_SIZE = 100;

export async function regenerateExpiredTasks(): Promise<{ processed: number; regenerated: number; errors: number }> {
    let totalProcessed = 0;
    let totalRegenerated = 0;
    let totalErrors = 0;
    let hasMore = true;
    let skip = 0;

    console.log('Début de la régénération des tâches expirées...');

    while (hasMore) {
        try {
            const tasksToCheck = await prisma.task.findMany({
                where: {
                    OR: [
                        { type: 'DAILY', status: { in: ['PENDING', 'COMPLETED'] } },
                        { type: 'WEEKLY', status: { in: ['PENDING', 'COMPLETED'] } }
                    ],
                    dateEnd: { not: null }
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    type: true,
                    difficulty: true,
                    userId: true,
                    dateEnd: true,
                    timezone: true,
                    status: true
                },
                take: BATCH_SIZE,
                skip: skip,
                orderBy: { createdAt: 'asc' }
            });

            if (tasksToCheck.length === 0) {
                hasMore = false;
                break;
            }

            console.log(`Traitement du batch ${Math.floor(skip / BATCH_SIZE) + 1}: ${tasksToCheck.length} tâches`);

            // Traiter chaque tâche du batch
            for (const task of tasksToCheck) {
                try {
                    if (shouldRecreateTask(task.dateEnd!, task.timezone)) {

                        const newDates = calculateNewTaskDates(task.type as TaskType, task.timezone);


                        const taskData = {
                            title: task.title,
                            description: task.description,
                            type: task.type,
                            difficulty: task.difficulty,
                            timezone: task.timezone,
                            status: TaskStatus.PENDING,
                            dateStart: newDates.dateStart,
                            dateEnd: newDates.dateEnd
                        };

                        await taskService.create(taskData, task.userId);

                        
                        const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TRUE_COMPLETED : TaskStatus.EXPIRED;


                        // Marquer l'ancienne tâche comme expirée
                        await prisma.task.update({
                            where: { id: task.id },
                            data: { status: newStatus }
                        });

                        totalRegenerated++;
                        console.log(`Tâche régénérée: ${task.title} (ID: ${task.id})`);
                    }
                } catch (error) {
                    console.error(`Erreur lors du traitement de la tâche ${task.id}:`, error);
                    totalErrors++;
                }
            }

            totalProcessed += tasksToCheck.length;
            skip += BATCH_SIZE;

            // Petite pause entre les batches pour éviter de surcharger la DB
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

        } catch (error) {
            console.error('Erreur lors du traitement du batch:', error);
            totalErrors++;
            hasMore = false;
        }
    }

    console.log(`Régénération terminée: ${totalProcessed} tâches traitées, ${totalRegenerated} régénérées, ${totalErrors} erreurs`);
    
    return {
        processed: totalProcessed,
        regenerated: totalRegenerated,
        errors: totalErrors
    };
}

// Fonction pour vérifier le statut de la régénération
export async function getRegenerationStatus(): Promise<{
    lastRun: Date | null;
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    expiredTasks: number;
}> {
    const [totalTasks, pendingTasks, completedTasks, expiredTasks] = await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { status: 'PENDING' } }),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.task.count({ where: { status: 'TRUE_COMPLETED' } }),
        prisma.task.count({ where: { status: 'EXPIRED' } }),
        prisma.task.count({ where: { status: 'DELETED' } })
    ]);

    return {
        lastRun: new Date(),
        totalTasks,
        pendingTasks,
        completedTasks,
        expiredTasks
    };
}