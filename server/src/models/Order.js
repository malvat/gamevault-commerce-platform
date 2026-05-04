import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    title: { type: String, required: true },
    coverImage: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    totalPrice: { type: Number, required: true },
    paymentProvider: { type: String, default: "stripe" },
    stripeCheckoutSessionId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: ["processing", "paid", "delivered", "cancelled"],
      default: "paid"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
