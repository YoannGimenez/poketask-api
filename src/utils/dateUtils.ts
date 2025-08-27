import { TaskType } from "../../generated/prisma";
import {startOfDay, endOfDay, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export function getStartOfDayInTimezone(timezone: string, date: Date = new Date()): Date {
    const zoned = toZonedTime(date, timezone);
    const localStart = startOfDay(zoned);
    return fromZonedTime(localStart, timezone);
}

export function getEndOfDayInTimezone(timezone: string, date: Date = new Date()): Date {
    const zoned = toZonedTime(date, timezone);
    const localEnd = endOfDay(zoned);
    return fromZonedTime(localEnd, timezone);
}

export function getStartOfWeekInTimezone(timezone: string, date: Date = new Date()): Date {
    const zoned = toZonedTime(date, timezone);
    const day = zoned.getDay();
    const daysToMonday = day === 0 ? 6 : day - 1;
    const monday = addDays(zoned, -daysToMonday);
    const localStart = startOfDay(monday);
    return fromZonedTime(localStart, timezone);
}

export function getEndOfWeekInTimezone(timezone: string, date: Date = new Date()): Date {
    const startOfWeek = getStartOfWeekInTimezone(timezone, date);
    const zoned = toZonedTime(startOfWeek, timezone);
    const sunday = addDays(zoned, 6);
    const localEnd = endOfDay(sunday);
    return fromZonedTime(localEnd, timezone);
}

export function shouldRecreateTask(taskDateEnd: Date, taskTimezone: string): boolean {
    const now = new Date();
    const taskEndLocal = toZonedTime(taskDateEnd, taskTimezone);
    const nowLocal = toZonedTime(now, taskTimezone);

    const taskEndDay = startOfDay(taskEndLocal).getTime();
    const nowDay = startOfDay(nowLocal).getTime();
    return nowDay > taskEndDay;
}

export function calculateNewTaskDates(taskType: TaskType, timezone: string): { dateStart: Date; dateEnd: Date } {
    if (taskType === TaskType.DAILY) {
        return {
            dateStart: getStartOfDayInTimezone(timezone),
            dateEnd: getEndOfDayInTimezone(timezone),
        };
    } else if (taskType === TaskType.WEEKLY) {
        return {
            dateStart: getStartOfWeekInTimezone(timezone),
            dateEnd: getEndOfWeekInTimezone(timezone),
        };
    }
    throw new Error('Type de tâche non supporté pour la régénération');
}