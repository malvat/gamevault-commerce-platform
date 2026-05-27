import dotenv from "dotenv";
import { createServer } from "node:http";
import { allowedOrigins, createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { createSocketServer } from "./socket.js";

dotenv.config();

const app = createApp();
const server = createServer(app);
const io = createSocketServer(server, allowedOrigins);
const port = process.env.PORT || 5000;

app.set("io", io);
connectDB();

server.listen(port, () => {
  console.log(`API running on port ${port}`);
});
