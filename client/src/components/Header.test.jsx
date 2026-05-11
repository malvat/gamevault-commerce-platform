import React from "react";
import "../test/setup.js";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import Header from "./Header.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { CartProvider } from "../context/CartContext.jsx";

const renderHeader = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Header />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );

describe("Header", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the signed-in user's first name as the account link", () => {
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

    renderHeader();

    expect(screen.getByRole("link", { name: /maya/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("link", { name: /wishlist/i })).toBeInTheDocument();
  });

  it("falls back to login when no user is signed in", () => {
    renderHeader();

    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: /wishlist/i })).not.toBeInTheDocument();
  });
});
