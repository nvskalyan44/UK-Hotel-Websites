"use client";

import { useCart } from "@/context/CartContext";
import { CheckIcon } from "./Icons";

export function ToastHost() {
  const { toast } = useCart();
  if (!toast) return null;
  return (
    <div className="toast">
      <CheckIcon /> {toast}
    </div>
  );
}
