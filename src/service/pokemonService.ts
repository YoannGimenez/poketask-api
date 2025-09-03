import prisma from "../lib/prisma";
import {EncounterItem, User} from "../../generated/prisma";

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

async function checkForEvolutions(user: User) {
    const userPokemons = await prisma.userPokemon.findMany({
        where: { userId: user.id },
        include: { pokemon: true },
    });

    // Map d'accès rapide aux données, éviter un call db par pokémon
    const allPokemons = await prisma.pokemon.findMany();
    const pokemonByName = new Map(allPokemons.map(p => [p.name, p]));
    const ownedPokemonMap = new Map(userPokemons.map(up => [up.pokemonId, up]));

    const evolutions: {
        basePokemonName: string;
        evolvedPokemonName: string;
        evolvedPokemonSpriteUrl: string;
    }[] = [];

    for (const up of userPokemons) {
        const basePokemon = up.pokemon;

        if (!basePokemon.levelEvolve || !basePokemon.evolvesInto.length) continue;

        if (user.level >= basePokemon.levelEvolve) {
            for (const evoName of basePokemon.evolvesInto) {
                const evoPokemon = pokemonByName.get(evoName);
                if (!evoPokemon) continue;

                const ownedEvo = ownedPokemonMap.get(evoPokemon.id);

                if (!ownedEvo) {
                    await prisma.userPokemon.create({
                        data: {
                            userId: user.id,
                            pokemonId: evoPokemon.id,
                            amountCaught: 1,
                            shiny: up.shiny,
                        },
                    });

                    ownedPokemonMap.set(evoPokemon.id, {
                        ...up,
                        id: -1,
                        pokemon: evoPokemon,
                        pokemonId: evoPokemon.id,
                        amountCaught: 1,
                        shiny: up.shiny,
                    });

                    evolutions.push({
                        basePokemonName: basePokemon.name,
                        evolvedPokemonName: evoPokemon.name,
                        evolvedPokemonSpriteUrl: up.shiny
                            ? evoPokemon.shinySpriteUrl
                            : evoPokemon.spriteUrl,
                    });
                } else {
                    if (up.shiny && !ownedEvo.shiny) {
                        await prisma.userPokemon.update({
                            where: { id: ownedEvo.id },
                            data: { shiny: true },
                        });
                        ownedEvo.shiny = true;

                        evolutions.push({
                            basePokemonName: basePokemon.name,
                            evolvedPokemonName: evoPokemon.name,
                            evolvedPokemonSpriteUrl: up.shiny
                                ? evoPokemon.shinySpriteUrl
                                : evoPokemon.spriteUrl,
                        });
                    }
                }
            }
        }
    }

    return evolutions;
}





export const pokemonService = {
    catchPokemon,
    getUserPokemons,
    checkForEvolutions,
};
