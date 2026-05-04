import express from "express";
import { confirmCheckoutSession, createCheckoutSession, createOrder, getMyLibrary, getMyOrders } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createOrder);
router.post("/checkout-session", protect, createCheckoutSession);
router.post("/checkout-session/confirm", protect, confirmCheckoutSession);
router.get("/mine", protect, getMyOrders);
router.get("/library", protect, getMyLibrary);

export default router;
