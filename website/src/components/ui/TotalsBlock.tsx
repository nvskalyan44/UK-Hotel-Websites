"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

interface TotalsBlockProps {
  showCouponInput?: boolean;
}

export function TotalsBlock({ showCouponInput = false }: TotalsBlockProps) {
  const cart = useCart();
  const [code, setCode] = useState("");

  const rows = [
    { label: "Subtotal", value: `£${cart.subtotal.toFixed(2)}` },
    cart.appliedCoupon
      ? { label: `Discount (${cart.appliedCoupon.code})`, value: `−£${cart.discount.toFixed(2)}`, accent: true }
      : null,
    cart.loyaltyDiscount > 0
      ? { label: `Loyalty points (${cart.loyaltyPointsUsed} pts)`, value: `−£${cart.loyaltyDiscount.toFixed(2)}`, accent: true }
      : null,
    {
      label: cart.orderType === "collection" ? "Delivery" : cart.deliveryFee === 0 ? "Delivery (FREE over £35)" : "Delivery",
      value: cart.orderType === "collection" ? "FREE" : cart.deliveryFee === 0 ? "FREE" : `£${cart.deliveryFee.toFixed(2)}`,
    },
  ].filter(Boolean) as { label: string; value: string; accent?: boolean }[];

  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14, color: r.accent ? "#4ade80" : "var(--ink-dim)" }}>
          <span>{r.label}</span>
          <span style={{ fontWeight: 600 }}>{r.value}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px", marginTop: 6, borderTop: "1px solid rgba(253, 186, 116, 0.08)", fontSize: 18 }}>
        <span style={{ fontWeight: 600 }}>Total</span>
        <span style={{ fontWeight: 700, fontFamily: "var(--display)", fontSize: 22 }} className="text-orange">
          £{cart.total.toFixed(2)}
        </span>
      </div>

      {showCouponInput && !cart.appliedCoupon && (
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <input
            className="field-input"
            placeholder="Promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ flex: 1 }}
          />
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => cart.applyCoupon(code)}>Apply</button>
        </div>
      )}
      {showCouponInput && cart.appliedCoupon && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#4ade80", fontSize: 13 }}>
            <b>{cart.appliedCoupon.code}</b> · {cart.appliedCoupon.title}
          </span>
          <button type="button" onClick={() => cart.setCoupon("")} style={{ color: "var(--faint)", fontSize: 12 }}>Remove</button>
        </div>
      )}
    </div>
  );
}
