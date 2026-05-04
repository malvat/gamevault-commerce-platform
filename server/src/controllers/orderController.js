import asyncHandler from "express-async-handler";
import Game from "../models/Game.js";
import Order from "../models/Order.js";

const stripeApiRequest = async (path, options = {}) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe sandbox key is not configured");
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || "Stripe checkout request failed");
  }

  return data;
};

const validateCartItems = async (userId, items) => {
  if (!items?.length) {
    throw new Error("Order must contain at least one game");
  }

  const gameIds = items.map((item) => item.gameId);

  if (new Set(gameIds).size !== gameIds.length || items.some((item) => Number(item.quantity) !== 1)) {
    throw new Error("Only one copy of each game can be purchased");
  }

  const ownedOrder = await Order.findOne({
    user: userId,
    status: { $in: ["paid", "delivered"] },
    "items.game": { $in: gameIds }
  });

  if (ownedOrder) {
    throw new Error("You already own one or more games in this cart");
  }

  const games = await Game.find({ _id: { $in: gameIds } });

  const orderItems = items.map((item) => {
    const game = games.find((currentGame) => currentGame._id.toString() === item.gameId);

    if (!game) {
      throw new Error("One or more games are no longer available");
    }

    return {
      game: game._id,
      title: game.title,
      coverImage: game.coverImage,
      price: game.price,
      quantity: item.quantity
    };
  });

  return orderItems;
};

const getClientUrl = (req) => process.env.CLIENT_URL || req.get("origin") || "http://localhost:5173";

export const createOrder = asyncHandler(async (req, res) => {
  const { items } = req.body;
  let orderItems;

  try {
    orderItems = await validateCartItems(req.user._id, items);
  } catch (err) {
    res.status(err.message.includes("already own") ? 409 : 400);
    throw err;
  }

  const totalPrice = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const order = await Order.create({ user: req.user._id, items: orderItems, totalPrice });

  res.status(201).json(order);
});

export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { items } = req.body;
  let orderItems;

  try {
    orderItems = await validateCartItems(req.user._id, items);
  } catch (err) {
    res.status(err.message.includes("already own") ? 409 : 400);
    throw err;
  }

  const clientUrl = getClientUrl(req);
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/cart`,
    client_reference_id: req.user._id.toString(),
    "metadata[userId]": req.user._id.toString(),
    "metadata[gameIds]": orderItems.map((item) => item.game.toString()).join(",")
  });

  orderItems.forEach((item, index) => {
    params.append(`line_items[${index}][quantity]`, String(item.quantity));
    params.append(`line_items[${index}][price_data][currency]`, "usd");
    params.append(`line_items[${index}][price_data][unit_amount]`, String(Math.round(item.price * 100)));
    params.append(`line_items[${index}][price_data][product_data][name]`, item.title);
  });

  const session = await stripeApiRequest("/checkout/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  res.status(201).json({ id: session.id, url: session.url });
});

export const confirmCheckoutSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    res.status(400);
    throw new Error("Checkout session is required");
  }

  const existingOrder = await Order.findOne({
    user: req.user._id,
    stripeCheckoutSessionId: sessionId
  });

  if (existingOrder) {
    return res.json(existingOrder);
  }

  const session = await stripeApiRequest(`/checkout/sessions/${sessionId}`);

  if (session.metadata?.userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Checkout session does not belong to this account");
  }

  if (session.payment_status !== "paid") {
    res.status(402);
    throw new Error("Stripe payment is not complete yet");
  }

  const items = (session.metadata?.gameIds || "")
    .split(",")
    .filter(Boolean)
    .map((gameId) => ({ gameId, quantity: 1 }));

  let orderItems;
  try {
    orderItems = await validateCartItems(req.user._id, items);
  } catch (err) {
    res.status(err.message.includes("already own") ? 409 : 400);
    throw err;
  }

  const totalPrice = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalPrice,
    paymentProvider: "stripe",
    stripeCheckoutSessionId: sessionId,
    status: "paid"
  });

  res.status(201).json(order);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

export const getMyLibrary = asyncHandler(async (req, res) => {
  const pageNumber = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.limit) || 8, 1), 40);
  const orders = await Order.find({
    user: req.user._id,
    status: { $in: ["paid", "delivered"] }
  }).sort({ createdAt: -1 });

  const ownedGames = [];
  const seen = new Set();

  for (const order of orders) {
    for (const item of order.items) {
      const id = item.game.toString();
      if (!seen.has(id)) {
        seen.add(id);
        ownedGames.push(item.game);
      }
    }
  }

  const total = ownedGames.length;
  const games = await Game.find({ _id: { $in: ownedGames.slice((pageNumber - 1) * pageSize, pageNumber * pageSize) } });
  const sortedGames = ownedGames
    .slice((pageNumber - 1) * pageSize, pageNumber * pageSize)
    .map((gameId) => games.find((game) => game._id.toString() === gameId.toString()))
    .filter(Boolean);

  res.json({
    games: sortedGames,
    page: pageNumber,
    pages: Math.max(Math.ceil(total / pageSize), 1),
    total
  });
});
