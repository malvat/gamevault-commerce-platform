import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = createApp();
const port = process.env.PORT || 5000;

connectDB();

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
