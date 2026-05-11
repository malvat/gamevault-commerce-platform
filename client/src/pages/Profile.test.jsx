import React from "react";
import "../test/setup.js";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import Profile from "./Profile.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";

const renderProfile = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Profile />
      </AuthProvider>
    </MemoryRouter>
  );

describe("Profile", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders saved first and last name values", () => {
    window.localStorage.setItem(
      "gameStoreUser",
      JSON.stringify({
        _id: "user-1",
        firstName: "Ava",
        lastName: "Patel",
        name: "Ava Patel",
        email: "ava@example.com",
        role: "customer",
        token: "token"
      })
    );

    renderProfile();

    expect(screen.getByLabelText(/first name/i)).toHaveValue("Ava");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Patel");
    expect(screen.getByLabelText(/email/i)).toHaveValue("ava@example.com");
  });
});
