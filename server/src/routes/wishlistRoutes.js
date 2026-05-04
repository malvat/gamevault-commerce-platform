import express from "express";
import {
  addToWishlist,
  getWishlist,
  getWishlistStatus,
  removeFromWishlist
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.get("/:gameId/status", protect, getWishlistStatus);
router.post("/:gameId", protect, addToWishlist);
router.delete("/:gameId", protect, removeFromWishlist);

export default router;
