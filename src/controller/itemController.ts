import {NextFunction, Request, Response} from "express";
import {itemService} from "../service/itemService";

async function getUserItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = (req.user as { id: string }).id;
        const userItems = await itemService.getUserItems(userId);
        res.status(200).json({ userItems });
    } catch (err) {
        next(err);
    }
}

export const itemController = {
    getUserItems
};