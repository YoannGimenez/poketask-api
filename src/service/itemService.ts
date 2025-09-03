import prisma from "../lib/prisma";

async function getUserItems(userId: string) {

    const userItems = await prisma.userItem.findMany({
        where: { userId },
        include: {
            item: true,
        },
    });

    return userItems.map(ui => ({
        itemId: ui.itemId,
        name: ui.item.name,
        description: ui.item.description,
        type: ui.item.type,
        quantity: ui.quantity,
        spriteUrl: ui.item.spriteUrl,
    }));
}

export const itemService = {
    getUserItems
};
