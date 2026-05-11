import React, { createContext, useContext, useMemo, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage.js";

const CartContext = createContext(null);

const normalizeCartItems = (cartItems) =>
  cartItems.reduce((uniqueItems, item) => {
    if (uniqueItems.some((currentItem) => currentItem._id === item._id)) {
      return uniqueItems;
    }

    return [...uniqueItems, { ...item, quantity: 1 }];
  }, []);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => normalizeCartItems(readStorage("gameStoreCart", [])));

  const persist = (nextItems) => {
    const normalizedItems = normalizeCartItems(nextItems);
    setItems(normalizedItems);
    writeStorage("gameStoreCart", normalizedItems);
  };

  const addToCart = (game) => {
    const existing = items.find((item) => item._id === game._id);
    const nextItems = existing ? items : [...items, { ...game, quantity: 1 }];

    persist(nextItems);
  };

  const updateQuantity = (gameId, quantity) => {
    if (quantity < 1) {
      persist(items.filter((item) => item._id !== gameId));
    }
  };

  const removeFromCart = (gameId) => {
    persist(items.filter((item) => item._id !== gameId));
  };

  const clearCart = () => persist([]);

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;

  const value = useMemo(
    () => ({ items, addToCart, updateQuantity, removeFromCart, clearCart, total, itemCount }),
    [items, total, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
