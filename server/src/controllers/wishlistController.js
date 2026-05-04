import asyncHandler from "express-async-handler";
import Game from "../models/Game.js";
import User from "../models/User.js";

const pageWishlist = async (userId, page = 1, limit = 8) => {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 8, 1), 40);
  const totalUser = await User.findById(userId).select("wishlist");
  const user = await User.findById(userId).populate({
    path: "wishlist",
    options: {
      sort: { rating: -1, title: 1 },
      skip: (pageNumber - 1) * pageSize,
      limit: pageSize
    }
  });
  const total = totalUser?.wishlist?.length ?? 0;

  return {
    games: user?.wishlist ?? [],
    page: pageNumber,
    pages: Math.max(Math.ceil(total / pageSize), 1),
    total
  };
};

export const getWishlist = asyncHandler(async (req, res) => {
  res.json(await pageWishlist(req.user._id, req.query.page, req.query.limit));
});

export const addToWishlist = asyncHandler(async (req, res) => {
  const game = await Game.findById(req.params.gameId);

  if (!game) {
    res.status(404);
    throw new Error("Game not found");
  }

  await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: game._id } });
  res.json({ message: "Game added to wishlist" });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.gameId } });
  res.json({ message: "Game removed from wishlist" });
});

export const getWishlistStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("wishlist");
  const wishlisted = user.wishlist.some((gameId) => gameId.toString() === req.params.gameId);

  res.json({ wishlisted });
});
