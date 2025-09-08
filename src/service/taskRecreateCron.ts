import cron from 'node-cron';
import { regenerateExpiredTasks } from '../service/taskRecreateService';

let isRunning = false;
let lastRun: Date | null = null;

export function startTaskRegenerationCron(): void {
    // Exécuter toutes les heures
    cron.schedule('0 * * * *', async () => {
        if (isRunning) {
            console.log('Régénération déjà en cours, ignorée...');
            return;
        }

        try {
            isRunning = true;
            lastRun = new Date();
            
            console.log(`Démarrage de la régénération des tâches à ${lastRun.toISOString()}`);
            
            const result = await regenerateExpiredTasks();
            
            console.log(`Régénération terminée avec succès:`, result);
            
        } catch (error) {
            console.error('Erreur critique lors de la régénération:', error);
        } finally {
            isRunning = false;
        }
    });
    
    console.log('CRON de régénération des tâches démarré (toutes les heures)');
}

export function getCronStatus(): { isRunning: boolean; lastRun: Date | null } {
    return { isRunning, lastRun };
}

export function stopTaskRegenerationCron(): void {
    cron.getTasks().forEach(task => task.stop());
    console.log('CRON de régénération des tâches arrêté');
}