import {EncounterPokemon, ItemType, Pokemon} from "../../generated/prisma";
import prisma from "../lib/prisma";

interface EncounterResult {
    pokemon: Pokemon | null;
    isShiny: boolean;
    pokeballs: {
        id: number;
        quantity: number;
        item: {
            id: number;
            name: string;
            type: ItemType;
        };
    }[];
}

async function encounterPokemon(locationId: number, userId: string): Promise<EncounterResult | null> {

    const encountersList = await prisma.encounterPokemon.findMany({
        where: { locationId }
    });

    if (encountersList) {
        const totalChance = encountersList.reduce((sum, encounter) => sum + encounter.encounterChance, 0);
        const randomValue = Math.random() * totalChance;
        let cumulative = 0;
        let selectedEncounter: EncounterPokemon | null = null;

        for (const encounter of encountersList) {
            cumulative += encounter.encounterChance;
            if (randomValue <= cumulative) {
                selectedEncounter = encounter;
                break;
            }
        }
        const isShiny = Math.random() < (1/4096);

        const pokemon = await prisma.pokemon.findUnique({
            where: { id: selectedEncounter?.pokemonId }
        });

        const pokeballs = await prisma.userItem.findMany({
            where: {
                userId,
                item: {
                    type: "POKEBALL"
                }
            },
            select: {
                id: true,
                quantity: true,
                item: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        spriteUrl: true,
                        catchChanceBonus: true
                    }
                }
            }
        });

        return {
            pokemon: pokemon,
            isShiny,
            pokeballs: pokeballs
        };
    }
    return null;
}

async function getUserLocations(userId: string) {
    const userLocations = await prisma.userLocation.findMany({
        where: { userId },
        include: {
            location: true,
        },
    });

    return userLocations.map((userLocation) => ({
        locationId: userLocation.locationId,
        name: userLocation.location.name,
        type: userLocation.location.type,
        region: userLocation.location.region,
    }));
}

export const locationService = {
    encounterPokemon,
    getUserLocations
};