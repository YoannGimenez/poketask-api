import prisma from "../lib/prisma";
import {EncounterItem} from "../../generated/prisma";

async function catchPokemon(
    pokemonId: number,
    locationId: number,
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
        await prisma.userPokemon.upsert({
            where: { userId_pokemonId: { userId, pokemonId } },
            create: {
                userId,
                pokemonId,
                amountCaught: 1,
                shiny: isShiny,
            },
            update: {
                amountCaught: { increment: 1 },
                ...(isShiny ? { shiny: true } : {})
            },
        });
    }

    return {
        success: true,
        captured: isCaptured,
        pokemon,
        rewards,
    };
}

async function getUserPokemons(userId: string) {

    const higherIdCaught = await prisma.userPokemon.findFirst({
        where: { userId, amountCaught: { gt: 0 } },
        orderBy: { pokemon: { pokedexId: "desc" } },
        select: { pokemon: { select: { pokedexId: true } } },
    });

    const pokedex = await prisma.pokemon.findMany({
        where: {
            pokedexId: { lte: higherIdCaught?.pokemon.pokedexId ?? 0 },
        },
        orderBy: { pokedexId: "asc" },
        include: {
            userPokemons: {
                where: { userId },
                select: { amountCaught: true, shiny: true },
            },
        },
    });

    return pokedex.map(p => {
        const userData = p.userPokemons[0];

        return {
            pokedexId: p.pokedexId,
            name: p.name,
            types: p.types,
            spriteUrl: p.spriteUrl,
            shiny: userData?.shiny ?? false,
            amountCaught: userData?.amountCaught ?? 0,
        };
    });
}

export const pokemonService = {
    catchPokemon,
    getUserPokemons
};
