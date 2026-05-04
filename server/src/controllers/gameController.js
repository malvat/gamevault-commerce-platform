import asyncHandler from "express-async-handler";
import Game from "../models/Game.js";
import Order from "../models/Order.js";
import { slugify } from "../utils/slugify.js";

export const getGames = asyncHandler(async (req, res) => {
  const { search = "", genre = "all", featured, page = 1, limit = 8 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  if (genre !== "all") {
    query.genre = genre;
  }

  if (featured === "true") {
    query.featured = true;
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 8, 1), 40);
  const total = await Game.countDocuments(query);
  const games = await Game.find(query)
    .sort({ featured: -1, rating: -1, createdAt: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);

  res.json({
    games,
    page: pageNumber,
    pages: Math.max(Math.ceil(total / pageSize), 1),
    total
  });
});

export const getGameBySlug = asyncHandler(async (req, res) => {
  const game = await Game.findOne({ slug: req.params.slug });

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  res.json(game);
});

export const getReviewStatus = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const purchased = await Order.exists({
    user: req.user._id,
    status: { $in: ["paid", "delivered"] },
    "items.game": game._id
  });
  const hasReviewed = game.reviews.some((review) => review.user.toString() === req.user._id.toString());

  res.json({
    purchased: Boolean(purchased),
    hasReviewed,
    canReview: Boolean(purchased) && !hasReviewed
  });
});

export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const game = await Game.findById(req.params.id);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const purchased = await Order.exists({
    user: req.user._id,
    status: { $in: ["paid", "delivered"] },
    "items.game": game._id
  });

  if (!purchased) {
    res.status(403);
    throw new Error("Purchase this game before leaving a review");
  }

  const alreadyReviewed = game.reviews.some((review) => review.user.toString() === req.user._id.toString());

  if (alreadyReviewed) {
    res.status(409);
    throw new Error("You already reviewed this game");
  }

  if (!rating || !comment?.trim()) {
    res.status(400);
    throw new Error("Please provide a rating and review");
  }

  game.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment
  });
  game.numReviews = game.reviews.length;

  const updatedGame = await game.save();
  res.status(201).json(updatedGame);
});

export const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const game = await Game.findById(req.params.id);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  const purchased = await Order.exists({
    user: req.user._id,
    status: { $in: ["paid", "delivered"] },
    "items.game": game._id
  });

  if (!purchased) {
    res.status(403);
    throw new Error("Purchase this game before editing a review");
  }

  const review = game.reviews.find((currentReview) => currentReview.user.toString() === req.user._id.toString());

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  if (!rating || !comment?.trim()) {
    res.status(400);
    throw new Error("Please provide a rating and review");
  }

  review.rating = Number(rating);
  review.comment = comment;
  const updatedGame = await game.save();

  res.json(updatedGame);
});

export const createGame = asyncHandler(async (req, res) => {
  const game = await Game.create({
    ...req.body,
    slug: slugify(req.body.title)
  });

  res.status(201).json(game);
});

export const updateGame = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  Object.assign(game, req.body);
  if (req.body.title) {
    game.slug = slugify(req.body.title);
  }

  const updatedGame = await game.save();
  res.json(updatedGame);
});

export const deleteGame = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.id);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  await game.deleteOne();
  res.json({ message: "Game removed" });
});
