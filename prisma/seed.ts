import {PokemonType, Region, LocationType, ItemType} from '../generated/prisma';
import prisma from "../src/lib/prisma";

// Conversion des types de PokeAPI → Enum Prisma
const typeMap: Record<string, PokemonType> = {
    normal: PokemonType.NORMAL,
    fire: PokemonType.FIRE,
    water: PokemonType.WATER,
    electric: PokemonType.ELECTRIC,
    grass: PokemonType.GRASS,
    ice: PokemonType.ICE,
    fighting: PokemonType.FIGHTING,
    poison: PokemonType.POISON,
    ground: PokemonType.GROUND,
    flying: PokemonType.FLYING,
    psychic: PokemonType.PSYCHIC,
    bug: PokemonType.BUG,
    rock: PokemonType.ROCK,
    ghost: PokemonType.GHOST,
    dark: PokemonType.DARK,
    dragon: PokemonType.DRAGON,
    steel: PokemonType.STEEL,
    fairy: PokemonType.FAIRY,
};

async function fetchPokemon(id: number) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();

    const speciesRes = await fetch(data.species.url);
    const species = await speciesRes.json();

    const frName =
        species.names.find((n: any) => n.language.name === 'fr')?.name ??
        data.name.charAt(0).toUpperCase() + data.name.slice(1);

    const evolutionRes = await fetch(species.evolution_chain.url);
    const evolutionData = await evolutionRes.json();

    const findEvolvesInto = async (chain: any, name: string): Promise<{ evolvesInto: string[], levelEvolve: number | null }> => {
        if (chain.species.name === name.toLowerCase()) {
            const evolvesInto = await Promise.all(
                chain.evolves_to.map(async (e: any) => {
                    const speciesRes = await fetch(e.species.url);
                    const speciesData = await speciesRes.json();
                    return speciesData.names.find((n: any) => n.language.name === 'fr')?.name ??
                        e.species.name.charAt(0).toUpperCase() + e.species.name.slice(1);
                })
            );

            return {
                evolvesInto,
                levelEvolve: chain.evolves_to[0]?.evolution_details[0]?.min_level ?? null,
            };
        }

        for (const e of chain.evolves_to) {
            const result = await findEvolvesInto(e, name);
            if (result) return result;
        }

        return { evolvesInto: [], levelEvolve: null };
    };

    const evolutionInfo = await findEvolvesInto(evolutionData.chain, data.name);


    return {
        pokedexId: data.id,
        name: frName,
        types: data.types.map((t: any) => typeMap[t.type.name]),
        spriteUrl: data.sprites.front_default,
        shinySpriteUrl: data.sprites.front_shiny,
        catchChance: 50,
        evolvesInto: evolutionInfo.evolvesInto,
        levelEvolve: evolutionInfo.levelEvolve,
    };
}

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Seed des 151 Pokémon
    for (let id = 1; id <= 151; id++) {
        const p = await fetchPokemon(id);
        await prisma.pokemon.upsert({
            where: { pokedexId: p.pokedexId },
            update: {},
            create: p,
        });
        if (id % 20 === 0) console.log(`➡️ ${id}/151 Pokémon insérés`);
    }

    // 2. Création des Locations
    const route1 = await prisma.location.upsert({
        where: { name: 'Route 1' },
        update: {},
        create: { name: 'Route 1', region: Region.KANTO, type: LocationType.ROUTE, moneyMin: 50, moneyMax: 150, levelUnlock: 1 },
    });

    const route2 = await prisma.location.upsert({
        where: { name: 'Route 2' },
        update: {},
        create: { name: 'Route 2', region: Region.KANTO, type: LocationType.ROUTE, moneyMin: 60, moneyMax: 160, levelUnlock: 3 },
    });

    // const route22 = await prisma.location.upsert({
    //     where: { name: 'Route 22' },
    //     update: {},
    //     create: { name: 'Route 22', region: Region.KANTO, type: LocationType.ROUTE, moneyMin: 70, moneyMax: 170, levelUnlock: 3 },
    // });

    const forest = await prisma.location.upsert({
        where: { name: 'Forêt de Jade' },
        update: {},
        create: { name: 'Forêt de Jade', region: Region.KANTO, type: LocationType.FOREST, moneyMin: 80, moneyMax: 180, levelUnlock: 4  },
    });

    const route3 = await prisma.location.upsert({
        where: { name: 'Route 3' },
        update: {},
        create: { name: 'Route 3', region: Region.KANTO, type: LocationType.ROUTE, moneyMin: 90, moneyMax: 190, levelUnlock: 5 },
    });

    // const moon = await prisma.location.upsert({
    //     where: { name: 'Mont Sélénite' },
    //     update: {},
    //     create: { name: 'Mont Sélénite', region: Region.KANTO, type: LocationType.CAVE, moneyMin: 100, moneyMax: 200, levelUnlock: 7 },
    // });
    //
    // const route4 = await prisma.location.upsert({
    //     where: { name: 'Route 4' },
    //     update: {},
    //     create: { name: 'Route 4', region: Region.KANTO, type: LocationType.ROUTE, moneyMin: 90, moneyMax: 190, levelUnlock: 8 },
    // });
    //
    // const route24 = await prisma.location.upsert({
    //     where: { name: 'Route 24' },
    //     update: {},
    //     create: { name: 'Route 24', region: Region.KANTO, type: LocationType.ROUTE, moneyMin: 90, moneyMax: 190, levelUnlock: 10 },
    // });
    //
    // const route25 = await prisma.location.upsert({
    //     where: { name: 'Route 25' },
    //     update: {},
    //     create: { name: 'Route 25', region: Region.KANTO, type: LocationType.ROUTE, moneyMin: 90, moneyMax: 190, levelUnlock: 11 },
    // });



    // 3. Associer Pokémon aux Locations

    const roucool = await prisma.pokemon.findUnique({ where: { pokedexId: 16 } });
    const ratata = await prisma.pokemon.findUnique({ where: { pokedexId: 19 } });
    const chenipan = await prisma.pokemon.findUnique({ where: { pokedexId: 10 } });
    const aspicot = await prisma.pokemon.findUnique({ where: { pokedexId: 13 } });
    const chrysacier = await prisma.pokemon.findUnique({ where: { pokedexId: 11 } });
    const coconfort = await prisma.pokemon.findUnique({ where: { pokedexId: 12 } });
    const pikachu = await prisma.pokemon.findUnique({ where: { pokedexId: 25 } });
    const piafabec = await prisma.pokemon.findUnique({ where: { pokedexId: 21 } });
    const nidoranF = await prisma.pokemon.findUnique({ where: { pokedexId: 29 } });
    const nidoranM = await prisma.pokemon.findUnique({ where: { pokedexId: 32 } });
    const rondoudou = await prisma.pokemon.findUnique({ where: { pokedexId: 39 } });
    const ferosinge = await prisma.pokemon.findUnique({ where: { pokedexId: 43 } });

    // const bulbasaur = await prisma.pokemon.findUnique({ where: { pokedexId: 1 } });
    // const charmander = await prisma.pokemon.findUnique({ where: { pokedexId: 4 } });
    // const squirtle = await prisma.pokemon.findUnique({ where: { pokedexId: 7 } });
    // const meowth = await prisma.pokemon.findUnique({ where: { pokedexId: 52 } });
    // const eevee = await prisma.pokemon.findUnique({ where: { pokedexId: 133 } });
    // const mewtwo = await prisma.pokemon.findUnique({ where: { pokedexId: 150 } });

    if (route1 && roucool && ratata) {
        await prisma.encounterPokemon.createMany({
            data: [
                { encounterChance: 50, locationId: route1.id, pokemonId: roucool.id },
                { encounterChance: 50, locationId: route1.id, pokemonId: ratata.id },
            ],
            skipDuplicates: true,
        });
    }

    if (route2 && roucool && ratata && chenipan && aspicot) {
        await prisma.encounterPokemon.createMany({
            data: [
                { encounterChance: 45, locationId: route2.id, pokemonId: roucool.id },
                { encounterChance: 45, locationId: route2.id, pokemonId: ratata.id },
                { encounterChance: 5, locationId: route2.id, pokemonId: chenipan.id },
                { encounterChance: 5, locationId: route2.id, pokemonId: aspicot.id },
            ],
            skipDuplicates: true,
        });
    }

    if (forest && chenipan && aspicot && chrysacier && coconfort && pikachu) {
        await prisma.encounterPokemon.createMany({
            data: [
                { encounterChance: 40, locationId: forest.id, pokemonId: chenipan.id },
                { encounterChance: 40, locationId: forest.id, pokemonId: aspicot.id },
                { encounterChance: 7.5, locationId: forest.id, pokemonId: chrysacier.id },
                { encounterChance: 7.5, locationId: forest.id, pokemonId: coconfort.id },
                { encounterChance: 5, locationId: forest.id, pokemonId: pikachu.id },
            ],
            skipDuplicates: true,
        });
    }

    if (route3 && roucool && piafabec && nidoranF && nidoranM && rondoudou && ferosinge) {
        await prisma.encounterPokemon.createMany({
            data: [
                { encounterChance: 25, locationId: route3.id, pokemonId: roucool.id },
                { encounterChance: 35, locationId: route3.id, pokemonId: piafabec.id },
                { encounterChance: 10, locationId: route3.id, pokemonId: nidoranF.id },
                { encounterChance: 10, locationId: route3.id, pokemonId: nidoranM.id },
                { encounterChance: 10, locationId: route3.id, pokemonId: rondoudou.id },
                { encounterChance: 10, locationId: route3.id, pokemonId: ferosinge.id },
            ],
            skipDuplicates: true,
        });
    }

    // if (moon && meowth && mewtwo) {
    //     await prisma.encounterPokemon.createMany({
    //         data: [
    //             { encounterChance: 0.8, locationId: moon.id, pokemonId: meowth.id },
    //             { encounterChance: 0.2, locationId: moon.id, pokemonId: mewtwo.id },
    //         ],
    //         skipDuplicates: true,
    //     });
    // }

    const pokeballs = [
        {
            name: 'Pokéball',
            type: ItemType.POKEBALL,
            description: 'Une Pokéball classique pour attraper des Pokémon.',
            spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
            evolvesPokemon: [],
            buyPrice: 200,
            sellPrice: 100,
            levelUnlock: 1,
            catchChanceBonus: 0,
        },
        {
            name: 'Super Ball',
            type: ItemType.POKEBALL,
            description: 'Une Super Ball qui augmente les chances de capture.',
            spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png',
            evolvesPokemon: [],
            buyPrice: 600,
            sellPrice: 300,
            levelUnlock: 3,
            catchChanceBonus: 15,
        },
        {
            name: 'Hyper Ball',
            type: ItemType.POKEBALL,
            description: 'Une Hyper Ball qui maximise les chances de capture.',
            spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png',
            evolvesPokemon: [],
            buyPrice: 1200,
            sellPrice: 600,
            levelUnlock: 5,
            catchChanceBonus: 25,
        },
    ];

    for (const ball of pokeballs) {
        await prisma.item.upsert({
            where: { name: ball.name },
            update: {},
            create: ball,
        });
    }

    console.log('✅ Seed terminé avec succès !');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
