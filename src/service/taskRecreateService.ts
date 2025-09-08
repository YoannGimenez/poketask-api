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

                        await prisma.task.update({
                            where: { id: task.id },
                            data: { status: newStatus }
                        });

                        totalRegenerated++;
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