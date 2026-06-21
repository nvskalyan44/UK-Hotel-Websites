"use client";

import { MinusIcon, PlusIcon } from "./Icons";

interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
  size?: "sm" | "md" | "lg";
}

export function QtyStepper({ qty, onChange, size = "md" }: QtyStepperProps) {
  const sz = size === "sm" ? { btn: 28, font: 14 } : size === "lg" ? { btn: 44, font: 18 } : { btn: 34, font: 16 };

  return (
    <div style={{
      display: "inline-flex", alignItems: "center",
      background: "rgba(20, 8, 4, 0.6)",
      borderRadius: 999,
      border: "1px solid rgba(253, 186, 116, 0.12)",
    }}>
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        style={{ width: sz.btn, height: sz.btn, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--orange-300)" }}
      >
        <MinusIcon width={16} height={16} />
      </button>
      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontSize: sz.font }}>{qty}</span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        style={{ width: sz.btn, height: sz.btn, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--orange-300)" }}
      >
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
