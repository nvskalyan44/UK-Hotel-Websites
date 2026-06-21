"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { TotalsBlock } from "@/components/ui/TotalsBlock";
import { XIcon, CartIcon, ArrowIcon } from "@/components/ui/Icons";
import { useRouter } from "next/navigation";

function CartItemRow({ item }: { item: ReturnType<typeof useCart>["items"][number] }) {
  const cart = useCart();
  const [showNote, setShowNote] = useState(false);
  const [noteValue, setNoteValue] = useState(item.notes ?? "");

  const handleNoteBlur = () => {
    cart.setNotes(item.id, noteValue.slice(0, 100));
  };

  return (
    <div style={{ display: "flex", gap: 14, padding: "16px 0", borderBottom: "1px solid rgba(253, 186, 116, 0.06)" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(40, 18, 8, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
        {item.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</div>
          <button type="button" onClick={() => cart.remove(item.id)} style={{ color: "var(--faint)", fontSize: 12 }}>Remove</button>
        </div>
        <div className="text-orange" style={{ fontWeight: 700, marginTop: 2 }}>£{(item.price * item.qty).toFixed(2)}</div>
        <div style={{ marginTop: 8 }}>
          <QtyStepper qty={item.qty} onChange={(q) => cart.setQty(item.id, q)} />
        </div>
        {item.notes && !showNote && (
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.4 }}>
            "{item.notes}"
          </div>
        )}
        {showNote ? (
          <div style={{ marginTop: 8 }}>
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value.slice(0, 100))}
              onBlur={handleNoteBlur}
              placeholder="e.g. extra spicy, no onions…"
              rows={2}
              maxLength={100}
              style={{
                width: "100%",
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(253, 186, 116, 0.2)",
                background: "rgba(20, 8, 4, 0.6)",
                color: "inherit",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: 1.45,
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "var(--faint)" }}>{noteValue.length}/100</span>
              <button
                type="button"
                onClick={() => { cart.setNotes(item.id, noteValue.slice(0, 100)); setShowNote(false); }}
                style={{ fontSize: 12, color: "var(--orange-300, #fb923c)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            style={{ marginTop: 6, fontSize: 12, color: "var(--faint)", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            {item.notes ? "Edit note" : "+ Add note"}
          </button>
        )}
      </div>
    </div>
  );
}

export function CartDrawer() {
  const cart = useCart();
  const router = useRouter();

  if (!cart.open) return null;
  const empty = cart.items.length === 0;

  return (
    <>
      <div className="cart-backdrop" onClick={() => cart.setOpen(false)} />
      <aside className="cart-drawer">
        <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(253, 186, 116, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700 }}>Your basket</div>
            <div className="text-muted" style={{ fontSize: 13 }}>{cart.count} item{cart.count === 1 ? "" : "s"}</div>
          </div>
          <button className="icon-btn" style={{ padding: 10, borderRadius: "50%" }} onClick={() => cart.setOpen(false)}>
            <XIcon />
          </button>
        </div>

        {empty ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Your basket is empty</div>
            <p className="text-muted" style={{ marginBottom: 24, maxWidth: 280 }}>Pick something delicious from our menu to get started.</p>
            <button className="btn btn-primary" onClick={() => { cart.setOpen(false); router.push("/menu"); }}>
              Browse menu
            </button>
          </div>
        ) : (
          <>
            <div className="scroll-y" style={{ flex: 1, padding: "12px 28px" }}>
              {cart.items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>

            <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(253, 186, 116, 0.1)", background: "rgba(13, 6, 4, 0.6)" }}>
              <TotalsBlock />
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginTop: 16 }}
                onClick={() => { cart.setOpen(false); router.push("/order"); }}
              >
                Checkout · £{cart.total.toFixed(2)} <ArrowIcon />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
