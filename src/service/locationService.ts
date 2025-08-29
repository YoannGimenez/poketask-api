import {EncounterPokemon, Pokemon} from "../../generated/prisma";
import prisma from "../lib/prisma";

interface EncounterResult {
    pokemon: Pokemon | null;
    isShiny: boolean;
}

async function encounterPokemon(locationId: number): Promise<EncounterResult | null> {

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

        return {
            pokemon: pokemon,
            isShiny
        };
    }
    return null;
}

export const locationService = {
    encounterPokemon
};