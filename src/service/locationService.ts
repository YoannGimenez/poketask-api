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
        where: {
            userId,
            unlocked: true
        },
        include: {
            location: true,
        },
        orderBy: {
            location: {
                levelUnlock: 'asc'
            }
        }
    });

    return userLocations.map((userLocation) => ({
        locationId: userLocation.locationId,
        name: userLocation.location.name,
        type: userLocation.location.type,
        region: userLocation.location.region,
        levelUnlock: userLocation.location.levelUnlock,
        moneyMin: userLocation.location.moneyMin,
        moneyMax: userLocation.location.moneyMax,
        completed: userLocation.completed,
        completedAmount: userLocation.completedAmount
    }));
}

async function createUserLocations(userId: string): Promise<void> {
    const allLocations = await prisma.location.findMany({
        select: {id: true, levelUnlock: true}
    });

    const userLocationsData = allLocations.map(location => ({
        userId,
        locationId: location.id,
        unlocked: location.levelUnlock === 1,
        completed: false,
        completedAmount: 0
    }));

    await prisma.userLocation.createMany({
        data: userLocationsData,
        skipDuplicates: true
    });
}

async function unlockLocationsByLevel(userId: string, userLevel: number): Promise<void> {
    const userLocationsToUnlock = await prisma.userLocation.findMany({
        where: {
            userId,
            unlocked: false,
            location: {
                levelUnlock: {
                    lte: userLevel
                }
            }
        },
        include: {
            location: {
                select: {
                    name: true
                }
            }
        }
    });

    const locationIds = userLocationsToUnlock.map(ul => ul.locationId);

    await prisma.userLocation.updateMany({
        where: {
            userId,
            locationId: {
                in: locationIds
            }
        },
        data: {
            unlocked: true
        }
    });
}


export const locationService = {
    encounterPokemon,
    getUserLocations,
    createUserLocations,
    unlockLocationsByLevel
};