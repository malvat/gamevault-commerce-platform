import dotenv from "dotenv";
import mongoose from "mongoose";
import Game from "../models/Game.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

dotenv.config();

const customers = [
  { name: "Maya Chen", email: "maya.player@test.com", password: "Player123!" },
  { name: "Noah Brooks", email: "noah.player@test.com", password: "Player123!" },
  { name: "Ava Patel", email: "ava.player@test.com", password: "Player123!" },
  { name: "Liam Carter", email: "liam.player@test.com", password: "Player123!" },
  { name: "Sofia Rivera", email: "sofia.player@test.com", password: "Player123!" },
  { name: "Ethan Kim", email: "ethan.player@test.com", password: "Player123!" },
  { name: "Grace Miller", email: "grace.player@test.com", password: "Player123!" },
  { name: "Owen Smith", email: "owen.player@test.com", password: "Player123!" }
];

const reviewComments = [
  "Beautifully polished and easy to recommend. The pacing kept me playing longer than expected.",
  "Fantastic experience from start to finish. It feels premium and absolutely belongs in the catalog.",
  "Smooth gameplay, strong presentation, and a lot of memorable moments. I would buy it again.",
  "Really impressive quality. The mechanics are sharp, and the whole package feels worth the price.",
  "A standout game with excellent atmosphere and satisfying progression. Great purchase.",
  "Loved the flow and presentation. It is the kind of game that makes the store look strong.",
  "Great controls, strong art direction, and plenty of replay value. Very happy with this one.",
  "A top-tier title that feels fun right away. Easy recommendation for PS5 players."
];

await mongoose.connect(process.env.MONGO_URI);

const games = await Game.find({}).sort({ rating: -1, title: 1 }).limit(20);

if (games.length < 16) {
  throw new Error("Need at least 16 games before seeding demo customers");
}

for (const [index, customer] of customers.entries()) {
  let user = await User.findOne({ email: customer.email });

  if (user) {
    user.name = customer.name;
    user.password = customer.password;
    user.role = "customer";
    await user.save();
  } else {
    user = await User.create({ ...customer, role: "customer" });
  }

  await Order.deleteMany({ user: user._id });

  const purchasedGames = [games[index * 2], games[index * 2 + 1]];
  const items = purchasedGames.map((game) => ({
    game: game._id,
    title: game.title,
    coverImage: game.coverImage,
    price: game.price,
    quantity: 1
  }));

  await Order.create({
    user: user._id,
    items,
    totalPrice: items.reduce((total, item) => total + item.price, 0),
    status: "paid"
  });

  for (const [gameIndex, game] of purchasedGames.entries()) {
    game.reviews = game.reviews.filter((review) => review.user.toString() !== user._id.toString());
    game.reviews.push({
      user: user._id,
      name: user.name,
      rating: gameIndex === 0 ? 5 : 4,
      comment: reviewComments[(index + gameIndex) % reviewComments.length]
    });
    game.numReviews = game.reviews.length;
    await game.save();
  }
}

console.log(`Seeded ${customers.length} demo customers, ${customers.length * 2} purchases, and ${customers.length * 2} reviews`);
await mongoose.disconnect();
