import express from "express";
import {
  createGame,
  createReview,
  deleteGame,
  getGameBySlug,
  getGames,
  getReviewStatus,
  updateReview,
  updateGame
} from "../controllers/gameController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(getGames).post(protect, adminOnly, createGame);
router.get("/:id/review-status", protect, getReviewStatus);
router.post("/:id/reviews", protect, createReview);
router.put("/:id/reviews/mine", protect, updateReview);
router.route("/:id").put(protect, adminOnly, updateGame).delete(protect, adminOnly, deleteGame);
router.get("/slug/:slug", getGameBySlug);

export default router;
