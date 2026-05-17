import dotenv from "dotenv";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "../config/db.js";
import Order from "../models/Order.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(serverRoot, ".env") });

const currency = "USD";
const lookbackDays = Number(process.env.WEEKLY_REPORT_LOOKBACK_DAYS || 7);
const outputDir = path.resolve(serverRoot, process.env.WEEKLY_REPORT_OUTPUT_DIR || "reports/weekly-orders");

const roundCurrency = (value) => Math.round(value * 100) / 100;

export const buildReport = (orders, periodStart, periodEnd) => {
  const gamesById = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const gameId = item.game.toString();
      const existingGame = gamesById.get(gameId) || {
        gameId,
        title: item.title,
        unitsSold: 0,
        revenue: 0
      };

      existingGame.unitsSold += item.quantity;
      existingGame.revenue = roundCurrency(existingGame.revenue + item.price * item.quantity);
      gamesById.set(gameId, existingGame);
    }
  }

  const games = Array.from(gamesById.values()).sort((firstGame, secondGame) => {
    if (secondGame.revenue !== firstGame.revenue) {
      return secondGame.revenue - firstGame.revenue;
    }

    return firstGame.title.localeCompare(secondGame.title);
  });

  return {
    reportType: "weekly-order-summary",
    generatedAt: new Date().toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    currency,
    totals: {
      orders: orders.length,
      unitsSold: games.reduce((total, game) => total + game.unitsSold, 0),
      revenue: roundCurrency(games.reduce((total, game) => total + game.revenue, 0))
    },
    games,
    orders: orders.map((order) => ({
      orderId: order._id.toString(),
      userId: order.user.toString(),
      status: order.status,
      totalPrice: roundCurrency(order.totalPrice),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        gameId: item.game.toString(),
        title: item.title,
        quantity: item.quantity,
        price: roundCurrency(item.price),
        lineTotal: roundCurrency(item.price * item.quantity)
      }))
    }))
  };
};

export const runWeeklyOrderReport = async () => {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() - lookbackDays);

  await connectDB();

  const orders = await Order.find({
    status: { $in: ["paid", "delivered"] },
    createdAt: { $gte: periodStart, $lt: periodEnd }
  }).sort({ createdAt: 1 });

  const report = buildReport(orders, periodStart, periodEnd);
  const fileDate = periodEnd.toISOString().slice(0, 10);
  const filePath = path.join(outputDir, `weekly-orders-${fileDate}.json`);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Weekly order report written to ${filePath}`);
  console.log(`Orders: ${report.totals.orders}, units sold: ${report.totals.unitsSold}, revenue: $${report.totals.revenue.toFixed(2)}`);

  await mongoose.disconnect();
};

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runWeeklyOrderReport().catch(async (error) => {
    console.error(`Weekly order report failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}
