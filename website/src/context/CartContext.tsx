"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { CartItem, MenuItem, Coupon } from "@/lib/types";
import { useConfig } from "@/context/ConfigContext";

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  coupon: string;
  appliedCoupon: Coupon | null;
  orderType: "delivery" | "collection";
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  open: boolean;
  toast: string | null;
  add: (item: MenuItem, qty?: number, variant?: { label: string; price: number }) => void;
  setQty: (id: string, qty: number) => void;
  setNotes: (id: string, notes: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  applyCoupon: (code: string, context?: { email?: string; orderType?: string }) => Promise<boolean>;
  setCoupon: (code: string) => void;
  setOrderType: (type: "delivery" | "collection") => void;
  setLoyaltyPointsUsed: (pts: number) => void;
  setDeliveryFeeOverride: (fee: number | null) => void;
  setOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

let toastTimer: ReturnType<typeof setTimeout>;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const config = useConfig();
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCouponState] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "collection">("delivery");
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [dbCoupons, setDbCoupons] = useState<Coupon[]>([]);
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/offers")
      .then(r => r.ok ? r.json() : [])
      .then(setDbCoupons)
      .catch(() => {});
  }, []);

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("abhi_cart");
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    try {
      const storedCoupon = localStorage.getItem("abhi_coupon");
      if (storedCoupon) setCouponState(storedCoupon);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("abhi_cart", JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem("abhi_coupon", coupon);
  }, [coupon, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 1800);
  }, []);

  const add = useCallback((item: MenuItem, qty = 1, variant?: { label: string; price: number }) => {
    const cartId = variant ? `${item.id}:${variant.label}` : item.id;
    const cartName = variant ? `${item.name} (${variant.label})` : item.name;
    const cartPrice = variant ? variant.price : item.price;
    setItems((prev) => {
      const existing = prev.find((x) => x.id === cartId);
      if (existing) return prev.map((x) => x.id === cartId ? { ...x, qty: x.qty + qty } : x);
      return [...prev, { id: cartId, name: cartName, price: cartPrice, emoji: item.emoji, veg: item.veg, qty, variant: variant?.label }];
    });
    showToast(`Added ${cartName} to basket`);
  }, [showToast]);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((x) => x.id !== id));
    } else {
      setItems((prev) => prev.map((x) => x.id === id ? { ...x, qty } : x));
    }
  }, []);

  const setNotes = useCallback((id: string, notes: string) => {
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, notes } : x));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCouponState("");
    setOrderType("delivery");
    setLoyaltyPointsUsed(0);
  }, []);

  const setCoupon = useCallback((code: string) => {
    setCouponState(code);
  }, []);

  const subtotal = useMemo(() => items.reduce((s, x) => s + x.price * x.qty, 0), [items]);

  const appliedCoupon = useMemo(
    () => dbCoupons.find((c) => c.code === coupon && c.active !== false && subtotal >= (c.minOrder ?? 0)) ?? null,
    [coupon, subtotal, dbCoupons]
  );

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.type === "percent"
      ? subtotal * appliedCoupon.discount / 100
      : appliedCoupon.discount;
  }, [appliedCoupon, subtotal]);

  const deliveryFee = useMemo(() => {
    if (orderType === "collection") return 0;
    if (subtotal === 0) return 0;
    if (subtotal >= config.freeDeliveryThreshold) return 0;
    return deliveryFeeOverride !== null ? deliveryFeeOverride : config.deliveryCharge;
  }, [subtotal, orderType, deliveryFeeOverride, config]);

  const loyaltyDiscount = useMemo(() => Math.floor(loyaltyPointsUsed / 100), [loyaltyPointsUsed]);

  const total = useMemo(() => Math.max(0, subtotal - discount - loyaltyDiscount) + deliveryFee, [subtotal, discount, loyaltyDiscount, deliveryFee]);

  const count = useMemo(() => items.reduce((s, x) => s + x.qty, 0), [items]);

  const applyCoupon = useCallback(async (code: string, context?: { email?: string; orderType?: string }): Promise<boolean> => {
    try {
      const res = await fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase(),
          subtotal,
          email: context?.email,
          itemIds: items.map((i) => i.id),
          orderType: context?.orderType,
        }),
      });
      const data = await res.json();
      if (!data.valid) {
        showToast(data.error || "Coupon not valid");
        return false;
      }
      setCouponState(data.code);
      const saved = data.type === "percent" ? subtotal * data.discount / 100 : data.discount;
      showToast(`${data.code} applied — you saved £${saved.toFixed(2)}`);
      return true;
    } catch {
      showToast("Failed to validate coupon");
      return false;
    }
  }, [items, subtotal, showToast]);

  return (
    <CartContext.Provider value={{
      items, count, subtotal, discount, deliveryFee, total,
      coupon, appliedCoupon, applyCoupon, setCoupon,
      orderType, setOrderType, loyaltyPointsUsed, loyaltyDiscount, setLoyaltyPointsUsed,
      setDeliveryFeeOverride,
      add, setQty, setNotes, remove, clear,
      open, setOpen, toast, showToast,
    }}>
      {children}
    </CartContext.Provider>
  );
}
