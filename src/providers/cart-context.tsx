"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE"; menuItemId: string }
  | { type: "INCREMENT"; menuItemId: string }
  | { type: "DECREMENT"; menuItemId: string }
  | { type: "CLEAR" };

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (menuItemId: string) => void;
  increment: (menuItemId: string) => void;
  decrement: (menuItemId: string) => void;
  clearCart: () => void;
  getQuantity: (menuItemId: string) => number;
}

// ─── Reducer ───────────────────────────────────────────────────────────────
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.menuItemId === action.item.menuItemId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItemId === action.item.menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.menuItemId !== action.menuItemId) };
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    case "DECREMENT": {
      const item = state.items.find((i) => i.menuItemId === action.menuItemId);
      if (!item) return state;
      if (item.quantity <= 1) {
        return { items: state.items.filter((i) => i.menuItemId !== action.menuItemId) };
      }
      return {
        items: state.items.map((i) =>
          i.menuItemId === action.menuItemId ? { ...i, quantity: i.quantity - 1 } : i
        ),
      };
    }
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD", item });
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    dispatch({ type: "REMOVE", menuItemId });
  }, []);

  const increment = useCallback((menuItemId: string) => {
    dispatch({ type: "INCREMENT", menuItemId });
  }, []);

  const decrement = useCallback((menuItemId: string) => {
    dispatch({ type: "DECREMENT", menuItemId });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const getQuantity = useCallback(
    (menuItemId: string) =>
      state.items.find((i) => i.menuItemId === menuItemId)?.quantity ?? 0,
    [state.items]
  );

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalAmount,
        addItem,
        removeItem,
        increment,
        decrement,
        clearCart,
        getQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
