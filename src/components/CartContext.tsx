"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export type DeliveryLocationType = "Dhaka" | "Outside Dhaka";

export const DEFAULT_DELIVERY_CHARGES: Record<DeliveryLocationType, number> = {
  Dhaka: 90,
  "Outside Dhaka": 120,
};

export interface CartItem {
  id: string; // Unique combination of productId/slug + variant
  productId?: string;
  name: string;
  slug: string;
  sku?: string;
  image?: string;
  categoryName?: string;
  variant?: string;
  selectedOptions?: Record<string, string>;
  unitPrice: number; // 0 if unpriced/quote
  quantity: number;
  deliveryTime?: string;
}

export type AddCartItemInput = Omit<CartItem, "id"> & { id?: string };

interface CartContextValue {
  items: CartItem[];
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryLocation: DeliveryLocationType;
  setDeliveryLocation: (location: DeliveryLocationType) => void;
  deliveryCharge: number;
  grandTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY_ITEMS = "nurshop_cart_v1_items";
const STORAGE_KEY_LOC = "nurshop_cart_v1_location";

export function generateCartItemId(
  slug: string,
  variant?: string,
  selectedOptions?: Record<string, string>
): string {
  const optionsKey = selectedOptions
    ? Object.entries(selectedOptions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join("|")
    : "";
  const variantKey = (variant || "").trim().toLowerCase();
  return `${slug}__${variantKey}__${optionsKey}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryLocation, setDeliveryLocationState] =
    useState<DeliveryLocationType>("Dhaka");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
      const savedLoc = localStorage.getItem(STORAGE_KEY_LOC) as DeliveryLocationType | null;
      if (savedLoc === "Dhaka" || savedLoc === "Outside Dhaka") {
        setDeliveryLocationState(savedLoc);
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, hydrated]);

  const setDeliveryLocation = useCallback((loc: DeliveryLocationType) => {
    setDeliveryLocationState(loc);
    try {
      localStorage.setItem(STORAGE_KEY_LOC, loc);
    } catch (e) {
      console.error("Failed to save delivery location to localStorage", e);
    }
  }, []);

  const addItem = useCallback((itemInput: AddCartItemInput) => {
    const itemId =
      itemInput.id ||
      generateCartItemId(
        itemInput.slug,
        itemInput.variant,
        itemInput.selectedOptions
      );

    const qtyToAdd = Math.max(1, itemInput.quantity || 1);

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === itemId);
      if (existingIdx > -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + qtyToAdd,
          unitPrice: itemInput.unitPrice, // Keep latest unit price
          deliveryTime: itemInput.deliveryTime || next[existingIdx].deliveryTime,
        };
        return next;
      }
      return [
        ...prev,
        {
          ...itemInput,
          id: itemId,
          quantity: qtyToAdd,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (Number(item.unitPrice) || 0) * item.quantity,
        0
      ),
    [items]
  );

  const deliveryCharge = useMemo(
    () => DEFAULT_DELIVERY_CHARGES[deliveryLocation] ?? 90,
    [deliveryLocation]
  );

  const grandTotal = useMemo(
    () => (subtotal > 0 ? subtotal + deliveryCharge : 0),
    [subtotal, deliveryCharge]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        deliveryLocation,
        setDeliveryLocation,
        deliveryCharge,
        grandTotal,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
