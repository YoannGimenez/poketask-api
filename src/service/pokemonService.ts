import prisma from "../lib/prisma";
import { EncounterItem } from "../../generated/prisma";

async function catchPokemon(
    locationId: number,
    pokemonId: number,
    itemId: number,
    userId: string,
    isShiny: boolean
) {
    const location = await prisma.location.findUnique({
        where: { id: locationId },
    });

    if (!location) {
        throw new Error("Location introuvable");
    }

    const pokemon = await prisma.pokemon.findUnique({ where: { id: pokemonId } });
    if (!pokemon) {
        throw new Error("Pokemon introuvable");
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
        throw new Error("Item introuvable");
    }

    const catchItemUsed = await prisma.userItem.findUnique({
        where: { userId_itemId: { userId, itemId } },
    });
    if (!catchItemUsed || catchItemUsed.quantity <= 0) {
        throw new Error("Vous n'avez pas cet item");
    } else {
        await prisma.userItem.update({
            where: { userId_itemId: { userId, itemId } },
            data: { quantity: { decrement: 1 } },
        });
    }

    const finalCatchRate = pokemon.catchChance + item.catchChanceBonus;
    const random = Math.random() * 100;
    const isCaptured = random <= finalCatchRate;

    const itemRewardsList = await prisma.encounterItem.findMany({
        where: { locationId },
    });

    let selectedItemReward: EncounterItem | null = null;

    if (itemRewardsList && itemRewardsList.length > 0) {

        const roll = Math.random() * 100;
        let cumulative = 0;

        for (const itemReward of itemRewardsList) {
            cumulative += itemReward.encounterChance;
            if (roll <= cumulative) {
                selectedItemReward = itemReward;
                break;
            }
        }

        if (selectedItemReward) {
            await prisma.userItem.upsert({
                where: { userId_itemId: { userId, itemId: selectedItemReward.itemId } },
                update: { quantity: { increment: 1 } },
                create: { userId, itemId: selectedItemReward.itemId, quantity: 1 },
            });
        }
    }

    const money =
        Math.floor(Math.random() * (location.moneyMax - location.moneyMin + 1)) +
        location.moneyMin;

    let rewards: { money: number; item: EncounterItem | null } = {
        money: money,
        item: selectedItemReward,
    };

    await prisma.user.update({
        where: { id: userId },
        data: { money: { increment: money } },
    });

    if (isCaptured) {
        const existing = await prisma.userPokemon.findUnique({
            where: { userId_pokemonId: { userId, pokemonId } },
        });

        if (!existing) {
            await prisma.userPokemon.create({
                data: {
                    userId,
                    pokemonId,
                    amountCaught: { increment: 1 },
                    shiny: isShiny,
                },
            });
        } else {
            if (!existing.shiny && isShiny) {
                await prisma.userPokemon.update({
                    where: { userId_pokemonId: { userId, pokemonId } },
                    data: {
                        shiny: true,
                        amountCaught: { increment: 1 },
                    },
                });
            } else {
                await prisma.userPokemon.update({
                    where: { userId_pokemonId: { userId, pokemonId } },
                    data: {
                        amountCaught: { increment: 1 },
                    },
                });
            }
        }
    }

    return {
        success: true,
        captured: isCaptured,
        pokemon,
        rewards,
    };
}

export const pokemonService = {
    catchPokemon,
};
