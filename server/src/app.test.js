import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import Conversation from "./models/Conversation.js";
import FriendRequest from "./models/FriendRequest.js";
import Game from "./models/Game.js";
import Message from "./models/Message.js";
import Order from "./models/Order.js";
import User from "./models/User.js";

process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

const app = createApp();
let mongo;

const registerUser = async (overrides = {}) => {
  const payload = {
    firstName: "Demo",
    lastName: "Player",
    email: `demo-${Date.now()}-${Math.random()}@example.com`,
    password: "Player123!",
    ...overrides
  };

  return request(app).post("/api/auth/register").send(payload);
};

describe("API", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Game.deleteMany({}),
      Order.deleteMany({}),
      FriendRequest.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("registers users with first and last name fields", async () => {
    const response = await registerUser({
      firstName: "Maya",
      lastName: "Chen",
      email: "maya@example.com"
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      firstName: "Maya",
      lastName: "Chen",
      name: "Maya Chen",
      email: "maya@example.com",
      role: "customer"
    });
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("updates the signed-in user's profile details", async () => {
    const registered = await registerUser({ email: "profile@example.com" });

    const response = await request(app)
      .put("/api/auth/profile")
      .set("Authorization", `Bearer ${registered.body.token}`)
      .send({ firstName: "Ava", lastName: "Patel" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      firstName: "Ava",
      lastName: "Patel",
      name: "Ava Patel"
    });

    const user = await User.findOne({ email: "profile@example.com" });
    expect(user.name).toBe("Ava Patel");
  });

  it("creates an order for a signed-in customer", async () => {
    const registered = await registerUser({ email: "buyer@example.com" });
    const game = await Game.create({
      title: "Neon Rift",
      slug: "neon-rift",
      description: "Fast arena action.",
      genre: "Action",
      platform: ["PC"],
      price: 39.99,
      coverImage: "https://example.com/neon.jpg",
      rating: 4.7
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${registered.body.token}`)
      .send({ items: [{ gameId: game._id.toString(), quantity: 1 }] });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      totalPrice: 39.99,
      status: "paid"
    });
    expect(response.body.items[0]).toMatchObject({
      title: "Neon Rift",
      price: 39.99,
      quantity: 1
    });
  });

  it("blocks duplicate purchases for games already owned", async () => {
    const registered = await registerUser({ email: "owned@example.com" });
    const user = await User.findOne({ email: "owned@example.com" });
    const game = await Game.create({
      title: "Myth Harbor",
      slug: "myth-harbor",
      description: "Sea myth RPG.",
      genre: "RPG",
      platform: ["PC"],
      price: 59.99,
      coverImage: "https://example.com/myth.jpg",
      rating: 4.9
    });
    await Order.create({
      user: user._id,
      items: [{ game: game._id, title: game.title, coverImage: game.coverImage, price: game.price, quantity: 1 }],
      totalPrice: game.price,
      status: "paid"
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${registered.body.token}`)
      .send({ items: [{ gameId: game._id.toString(), quantity: 1 }] });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("You already own one or more games in this cart");
  });

  it("lets users become friends and exchange messages", async () => {
    const maya = await registerUser({ firstName: "Maya", lastName: "Chen", email: "maya@example.com" });
    const noah = await registerUser({ firstName: "Noah", lastName: "Singh", email: "noah@example.com" });

    const search = await request(app)
      .get("/api/friends/search?email=noah%40example.com")
      .set("Authorization", `Bearer ${maya.body.token}`);

    expect(search.status).toBe(200);
    expect(search.body.status).toBe("none");
    expect(search.body.user.email).toBe("noah@example.com");

    const friendRequest = await request(app)
      .post("/api/friends/requests")
      .set("Authorization", `Bearer ${maya.body.token}`)
      .send({ email: "noah@example.com" });

    expect(friendRequest.status).toBe(201);
    expect(friendRequest.body.status).toBe("pending");

    const accepted = await request(app)
      .post(`/api/friends/requests/${friendRequest.body._id}/accept`)
      .set("Authorization", `Bearer ${noah.body.token}`);

    expect(accepted.status).toBe(200);
    expect(accepted.body.status).toBe("accepted");

    const message = await request(app)
      .post(`/api/friends/${noah.body._id}/messages`)
      .set("Authorization", `Bearer ${maya.body.token}`)
      .send({ body: "Want to squad up later?" });

    expect(message.status).toBe(201);
    expect(message.body).toMatchObject({
      body: "Want to squad up later?"
    });

    const messages = await request(app)
      .get(`/api/friends/${maya.body._id}/messages`)
      .set("Authorization", `Bearer ${noah.body.token}`);

    expect(messages.status).toBe(200);
    expect(messages.body.messages[0].body).toBe("Want to squad up later?");
  });
});
