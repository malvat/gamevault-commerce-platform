import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { createChatMessage } from "./controllers/friendController.js";
import User from "./models/User.js";

export const createSocketServer = (httpServer, allowedOrigins = []) => {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        throw new Error("Missing auth token");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name email");

      if (!user) {
        throw new Error("User not found");
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Not authorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id.toString()}`);

    socket.on("chat:send", async ({ recipientId, body }, acknowledge) => {
      try {
        const message = await createChatMessage(socket.user._id, recipientId, body);
        io.to(`user:${socket.user._id.toString()}`).emit("chat:message", message);
        io.to(`user:${recipientId}`).emit("chat:message", message);
        acknowledge?.({ ok: true, message });
      } catch (err) {
        acknowledge?.({ ok: false, message: err.message || "Message failed" });
      }
    });
  });

  return io;
};
