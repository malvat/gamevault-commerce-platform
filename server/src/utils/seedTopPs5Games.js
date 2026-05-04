import dotenv from "dotenv";
import mongoose from "mongoose";
import Game from "../models/Game.js";
import { slugify } from "./slugify.js";

dotenv.config();

const colors = [
  "0f172a",
  "172554",
  "312e81",
  "581c87",
  "701a75",
  "831843",
  "7f1d1d",
  "713f12",
  "14532d",
  "164e63"
];

const makeCover = (title, index) => {
  const text = encodeURIComponent(title.replace(/:/g, " -"));
  const color = colors[index % colors.length];
  return `https://placehold.co/900x600/${color}/f8fafc/png?text=${text}`;
};

const games = [
  {
    title: "Elden Ring",
    genre: "RPG",
    metascore: 96,
    price: 59.99,
    releaseDate: "2022-02-25",
    description: "A vast fantasy action RPG built around demanding combat, open exploration, and haunting world design."
  },
  {
    title: "Baldur's Gate 3",
    genre: "RPG",
    metascore: 96,
    price: 69.99,
    releaseDate: "2023-09-06",
    description: "A choice-heavy party RPG with tactical battles, deep character builds, and branching storylines."
  },
  {
    title: "Astro Bot",
    genre: "Adventure",
    metascore: 94,
    price: 59.99,
    releaseDate: "2024-09-06",
    description: "A joyful platform adventure that celebrates PlayStation history with inventive worlds and gadgets."
  },
  {
    title: "Elden Ring: Shadow of the Erdtree",
    genre: "RPG",
    metascore: 94,
    price: 39.99,
    releaseDate: "2024-06-21",
    description: "A massive Elden Ring expansion with new lands, bosses, weapons, and lore-soaked discoveries."
  },
  {
    title: "The Witcher 3: Wild Hunt - Complete Edition",
    genre: "RPG",
    metascore: 94,
    price: 49.99,
    releaseDate: "2022-12-14",
    description: "A complete open-world monster-hunting RPG enhanced for PS5 with expansions and visual upgrades."
  },
  {
    title: "Metaphor: ReFantazio",
    genre: "RPG",
    metascore: 94,
    price: 69.99,
    releaseDate: "2024-10-11",
    description: "A stylish fantasy RPG mixing social bonds, archetype classes, dungeons, and turn-based combat."
  },
  {
    title: "God of War: Ragnarok",
    genre: "Action",
    metascore: 94,
    price: 69.99,
    releaseDate: "2022-11-09",
    description: "Kratos and Atreus face prophecy, gods, and monsters in a cinematic Norse action adventure."
  },
  {
    title: "Hades",
    genre: "Action",
    metascore: 93,
    price: 24.99,
    releaseDate: "2021-08-13",
    description: "A fast roguelike dungeon crawler where every escape attempt builds story, power, and momentum."
  },
  {
    title: "Hades II",
    genre: "Action",
    metascore: 93,
    price: 29.99,
    releaseDate: "2026-04-14",
    description: "A mythic roguelike sequel with witchcraft, new gods, and relentless underworld combat."
  },
  {
    title: "Tetris Effect: Connected",
    genre: "Puzzle",
    metascore: 93,
    price: 39.99,
    releaseDate: "2023-02-22",
    description: "A hypnotic audiovisual Tetris experience with solo, co-op, and competitive modes."
  },
  {
    title: "Resident Evil 4",
    genre: "Horror",
    metascore: 93,
    price: 59.99,
    releaseDate: "2023-03-24",
    description: "A survival-horror remake with tense combat, modern controls, and a reworked village nightmare."
  },
  {
    title: "Clair Obscur: Expedition 33",
    genre: "RPG",
    metascore: 92,
    price: 49.99,
    releaseDate: "2025-04-24",
    description: "A cinematic turn-based RPG with real-time reactions and a surreal Belle Epoque fantasy world."
  },
  {
    title: "Hollow Knight: Silksong",
    genre: "Adventure",
    metascore: 92,
    price: 29.99,
    releaseDate: "2025-09-04",
    description: "A precise action adventure starring Hornet across a dangerous kingdom of silk and song."
  },
  {
    title: "Final Fantasy VII Rebirth",
    genre: "RPG",
    metascore: 92,
    price: 69.99,
    releaseDate: "2024-02-29",
    description: "Cloud and company journey beyond Midgar in a rich, modern reimagining of a classic RPG."
  },
  {
    title: "Forza Horizon 5",
    genre: "Racing",
    metascore: 92,
    price: 59.99,
    releaseDate: "2025-04-29",
    description: "A vibrant open-world racing festival packed with cars, events, and high-speed exploration."
  },
  {
    title: "Street Fighter 6",
    genre: "Fighting",
    metascore: 92,
    price: 59.99,
    releaseDate: "2023-06-02",
    description: "A polished fighting game with modern controls, world tour progression, and competitive depth."
  },
  {
    title: "Demon's Souls",
    genre: "Action",
    metascore: 92,
    price: 69.99,
    releaseDate: "2020-11-11",
    description: "A visually stunning remake of the dark fantasy action RPG that helped define a genre."
  },
  {
    title: "Slay the Princess - The Pristine Cut",
    genre: "Adventure",
    metascore: 91,
    price: 19.99,
    releaseDate: "2024-10-24",
    description: "A branching horror visual novel built around choices, looping consequences, and sharp writing."
  },
  {
    title: "Split Fiction",
    genre: "Adventure",
    metascore: 91,
    price: 49.99,
    releaseDate: "2025-03-06",
    description: "A co-op action adventure that jumps between sci-fi and fantasy stories with playful set pieces."
  },
  {
    title: "Persona 5 Royal",
    genre: "RPG",
    metascore: 91,
    price: 59.99,
    releaseDate: "2022-10-21",
    description: "A stylish JRPG about phantom thieves, social bonds, turn-based battles, and hidden desires."
  },
  {
    title: "DAVE THE DIVER",
    genre: "Adventure",
    metascore: 91,
    price: 19.99,
    releaseDate: "2024-04-16",
    description: "A charming hybrid of underwater exploration, fishing, restaurant management, and mystery."
  },
  {
    title: "Rogue Legacy 2",
    genre: "Action",
    metascore: 90,
    price: 24.99,
    releaseDate: "2023-06-20",
    description: "A genealogical roguelite where each new heir changes how you fight through a shifting castle."
  },
  {
    title: "Citizen Sleeper 2: Starward Vector",
    genre: "RPG",
    metascore: 90,
    price: 24.99,
    releaseDate: "2025-01-31",
    description: "A narrative RPG about survival, debt, crew management, and hard choices on the edge of space."
  },
  {
    title: "Marvel's Spider-Man 2",
    genre: "Action",
    metascore: 90,
    price: 69.99,
    releaseDate: "2023-10-20",
    description: "Peter Parker and Miles Morales swing through an expanded New York against Venom and Kraven."
  },
  {
    title: "Destiny 2: The Final Shape",
    genre: "Shooter",
    metascore: 90,
    price: 49.99,
    releaseDate: "2024-06-04",
    description: "A climactic online shooter expansion sending Guardians into the Traveler to confront the Witness."
  },
  {
    title: "Balatro",
    genre: "Strategy",
    metascore: 90,
    price: 14.99,
    releaseDate: "2024-02-20",
    description: "A poker-inspired roguelike deckbuilder filled with jokers, multipliers, and outrageous combos."
  },
  {
    title: "Cocoon",
    genre: "Puzzle",
    metascore: 90,
    price: 24.99,
    releaseDate: "2023-09-29",
    description: "A compact puzzle adventure about carrying worlds inside worlds and solving cosmic machinery."
  },
  {
    title: "The Last of Us Part II Remastered",
    genre: "Action",
    metascore: 90,
    price: 49.99,
    releaseDate: "2024-01-19",
    description: "A PS5 remaster of Naughty Dog's intense survival story with visual upgrades and new modes."
  },
  {
    title: "The Talos Principle 2",
    genre: "Puzzle",
    metascore: 90,
    price: 29.99,
    releaseDate: "2023-11-02",
    description: "A philosophical first-person puzzle game about machines, civilization, and impossible structures."
  },
  {
    title: "Tony Hawk's Pro Skater 1 + 2",
    genre: "Sports",
    metascore: 90,
    price: 39.99,
    releaseDate: "2021-03-26",
    description: "A crisp remake collection of two legendary skateboarding games with classic stages and tricks."
  },
  {
    title: "Tekken 8",
    genre: "Fighting",
    metascore: 90,
    price: 69.99,
    releaseDate: "2024-01-26",
    description: "A flashy 3D fighting sequel focused on aggressive combat and the Mishima family feud."
  },
  {
    title: "Moss: Book II",
    genre: "Adventure",
    metascore: 90,
    price: 29.99,
    releaseDate: "2023-02-22",
    description: "A storybook VR adventure where you guide Quill through puzzles, combat, and danger."
  },
  {
    title: "Final Fantasy XIV: Endwalker",
    genre: "RPG",
    metascore: 90,
    price: 39.99,
    releaseDate: "2021-12-07",
    description: "A sweeping MMO expansion that closes a long-running saga with dungeons, raids, and drama."
  },
  {
    title: "Sektori",
    genre: "Shooter",
    metascore: 89,
    price: 19.99,
    releaseDate: "2025-11-18",
    description: "A neon twin-stick shooter driven by techno rhythms, rapid upgrades, and arcade pressure."
  },
  {
    title: "Dead Space",
    genre: "Horror",
    metascore: 89,
    price: 59.99,
    releaseDate: "2023-01-27",
    description: "A rebuilt sci-fi survival-horror classic set aboard a mining ship overrun by necromorphs."
  },
  {
    title: "Final Fantasy VII Remake Intergrade",
    genre: "RPG",
    metascore: 89,
    price: 69.99,
    releaseDate: "2021-06-10",
    description: "A PS5-enhanced Midgar adventure with faster loading, improved visuals, and Yuffie's episode."
  },
  {
    title: "Death Stranding 2: On The Beach",
    genre: "Adventure",
    metascore: 89,
    price: 69.99,
    releaseDate: "2025-06-26",
    description: "A cinematic journey of connection, survival, strange landscapes, and Kojima-scale spectacle."
  },
  {
    title: "Like a Dragon: Infinite Wealth",
    genre: "RPG",
    metascore: 89,
    price: 69.99,
    releaseDate: "2024-01-26",
    description: "A huge RPG adventure across Japan and Hawaii with dramatic story and absurd side activities."
  },
  {
    title: "Resident Evil Requiem",
    genre: "Horror",
    metascore: 89,
    price: 69.99,
    releaseDate: "2026-02-27",
    description: "A survival-horror entry following Grace Ashcroft and Leon Kennedy through a chilling new threat."
  },
  {
    title: "Dispatch",
    genre: "Adventure",
    metascore: 89,
    price: 29.99,
    releaseDate: "2025-10-22",
    description: "A superhero workplace comedy about managing former villains while rebuilding a heroic career."
  }
];

await mongoose.connect(process.env.MONGO_URI);

await Game.deleteMany({});
await Game.insertMany(
  games.map((game, index) => ({
    title: game.title,
    slug: slugify(game.title),
    description: game.description,
    genre: game.genre,
    platform: ["PS5"],
    price: game.price,
    coverImage: makeCover(game.title, index),
    rating: Number((game.metascore / 20).toFixed(1)),
    stock: 75 + ((index * 7) % 65),
    featured: index < 8,
    releaseDate: game.releaseDate
  }))
);

console.log(`Seeded ${games.length} PS5 games`);
await mongoose.disconnect();
