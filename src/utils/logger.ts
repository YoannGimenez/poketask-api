import {ActionLog, UserLog} from "../../mongoose/logModel";

export async function addLog(
    route: string, method: string, success: boolean, body?: any, userId?: string, error?: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Cherche le document existant pour ce userId et cette date
    const logDoc = await UserLog.findOne({ userId, date: today });

    const action: ActionLog = {
        route,
        method,
        success,
        body,
        error,
        timestamp: new Date(),
    };

    if (logDoc) {
        logDoc.actions.push(action);
        await logDoc.save();
    } else {
        await UserLog.create({
            userId,
            date: today,
            actions: [action],
        });
    }
}
