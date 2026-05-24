import { describe, expect, it } from "vitest";
import { buildReport } from "./generateWeeklyOrderReport.js";

const id = (value) => ({ toString: () => value });

describe("buildReport", () => {
  it("aggregates paid order items by game and sorts by revenue", () => {
    const periodStart = new Date("2026-05-19T00:00:00.000Z");
    const periodEnd = new Date("2026-05-26T00:00:00.000Z");
    const orders = [
      {
        _id: id("order-1"),
        user: id("user-1"),
        status: "paid",
        totalPrice: 79.98,
        createdAt: new Date("2026-05-20T12:00:00.000Z"),
        items: [
          { game: id("game-1"), title: "Neon Rift", quantity: 1, price: 39.99 },
          { game: id("game-2"), title: "Myth Harbor", quantity: 1, price: 39.99 }
        ]
      },
      {
        _id: id("order-2"),
        user: id("user-2"),
        status: "delivered",
        totalPrice: 39.99,
        createdAt: new Date("2026-05-21T12:00:00.000Z"),
        items: [{ game: id("game-1"), title: "Neon Rift", quantity: 1, price: 39.99 }]
      }
    ];

    const report = buildReport(orders, periodStart, periodEnd);

    expect(report.totals).toEqual({
      orders: 2,
      unitsSold: 3,
      revenue: 119.97
    });
    expect(report.games).toEqual([
      { gameId: "game-1", title: "Neon Rift", unitsSold: 2, revenue: 79.98 },
      { gameId: "game-2", title: "Myth Harbor", unitsSold: 1, revenue: 39.99 }
    ]);
    expect(report.orders[0].items[0]).toMatchObject({
      gameId: "game-1",
      lineTotal: 39.99
    });
  });
});
