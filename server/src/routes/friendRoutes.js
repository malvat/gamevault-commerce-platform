import express from "express";
import {
  acceptFriendRequest,
  getFriendsDashboard,
  getMessages,
  rejectFriendRequest,
  searchUserByEmail,
  sendFriendRequest,
  sendMessage
} from "../controllers/friendController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getFriendsDashboard);
router.get("/search", protect, searchUserByEmail);
router.post("/requests", protect, sendFriendRequest);
router.post("/requests/:requestId/accept", protect, acceptFriendRequest);
router.post("/requests/:requestId/reject", protect, rejectFriendRequest);
router.get("/:friendId/messages", protect, getMessages);
router.post("/:friendId/messages", protect, sendMessage);

export default router;
