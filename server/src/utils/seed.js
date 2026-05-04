import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Game from "../models/Game.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { slugify } from "./slugify.js";

dotenv.config();
await connectDB();

const users = [
  { name: "Store Admin", email: "admin@gamestore.dev", password: "Admin123!", role: "admin" },
  { name: "Demo Player", email: "player@gamestore.dev", password: "Player123!", role: "customer" }
];

const games = [
  {
    title: "Neon Rift",
    description: "A fast cyberpunk action roguelite with synth-heavy arenas and branching upgrades.",
    genre: "Action",
    platform: ["PC", "PlayStation", "Xbox"],
    price: 39.99,
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    rating: 4.7,
    stock: 72,
    featured: true,
    releaseDate: "2025-03-12"
  },
  {
    title: "Kingdom Cartographer",
    description: "A cozy strategy game about mapping islands, trading resources, and building settlements.",
    genre: "Strategy",
    platform: ["PC", "Switch"],
    price: 24.99,
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80",
    rating: 4.5,
    stock: 48,
    featured: true,
    releaseDate: "2024-10-01"
  },
  {
    title: "Void Rally",
    description: "Anti-gravity racing across asteroid belts with upgradeable ships and online leaderboards.",
    genre: "Racing",
    platform: ["PC", "Xbox"],
    price: 29.99,
    coverImage: "https://images.unsplash.com/photo-1600861194942-f883de0dfe96?auto=format&fit=crop&w=900&q=80",
    rating: 4.3,
    stock: 35,
    featured: false,
    releaseDate: "2025-07-18"
  },
  {
    title: "Myth Harbor",
    description: "An open-world RPG where ancient sea myths shape your quests, companions, and combat style.",
    genre: "RPG",
    platform: ["PC", "PlayStation"],
    price: 59.99,
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80",
    rating: 4.9,
    stock: 91,
    featured: true,
    releaseDate: "2025-11-04"
  }
];

await Order.deleteMany();
await Game.deleteMany();
await User.deleteMany();

await User.insertMany(users);
await Game.insertMany(games.map((game) => ({ ...game, slug: slugify(game.title) })));

console.log("Demo data seeded");
process.exit();
