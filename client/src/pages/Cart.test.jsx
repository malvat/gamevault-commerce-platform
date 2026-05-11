import React from "react";
import "../test/setup.js";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cart from "./Cart.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { CartProvider } from "../context/CartContext.jsx";
import { apiRequest } from "../services/api.js";

vi.mock("../services/api.js", () => ({
  apiRequest: vi.fn()
}));

const game = {
  _id: "game-1",
  title: "Neon Rift",
  coverImage: "https://example.com/neon.jpg",
  price: 39.99,
  quantity: 1
};

const renderCart = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Cart />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe("Cart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem(
      "gameStoreUser",
      JSON.stringify({
        _id: "user-1",
        firstName: "Maya",
        lastName: "Chen",
        name: "Maya Chen",
        email: "maya@example.com",
        role: "customer",
        token: "token"
      })
    );
    window.localStorage.setItem("gameStoreCart", JSON.stringify([game]));
  });

  it("creates a Stripe checkout session for cart items", async () => {
    apiRequest.mockReturnValue(new Promise(() => {}));

    renderCart();
    fireEvent.click(screen.getByRole("button", { name: /purchase games/i }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith("/orders/checkout-session", {
        method: "POST",
        body: JSON.stringify({ items: [{ gameId: "game-1", quantity: 1 }] })
      });
    });
  });
});
