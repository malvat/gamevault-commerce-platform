import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    genre: { type: String, required: true },
    platform: [{ type: String, required: true }],
    price: { type: Number, required: true, min: 0 },
    coverImage: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    stock: { type: Number, default: 50, min: 0 },
    featured: { type: Boolean, default: false },
    releaseDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Game", gameSchema);
