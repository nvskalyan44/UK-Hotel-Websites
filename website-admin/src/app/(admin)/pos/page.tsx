"use client";

import { useState, useEffect, useMemo } from "react";
import type { MenuItem } from "@/lib/types";
import { printReceipt, type ReceiptData } from "@/lib/receipt";

type OrderType = "dine-in" | "takeaway" | "delivery";
type PayMethod = "cash" | "card";
type CartLine = { id: string; name: string; emoji: string; price: number; qty: number };

const VAT_RATE = 0; // VAT shown as informational only; prices are inclusive

export default function PosPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [discount, setDiscount] = useState("");
  const [table, setTable] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/admin/menu")
      .then(r => r.ok ? r.json() : [])
      .then((data: MenuItem[]) => setItems(data.filter(i => i.available !== false)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const seen: string[] = ["All"];
    for (const i of items) if (!seen.includes(i.category)) seen.push(i.category);
    return seen;
  }, [items]);

  const filtered = items.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q);
    return matchSearch && (cat === "All" || i.category === cat);
  });

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const discountNum = Math.min(Math.max(0, parseFloat(discount) || 0), subtotal);
  const total = Math.max(0, subtotal - discountNum);
  const vat = +(total - total / (1 + VAT_RATE)).toFixed(2);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const add = (i: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(l => l.id === i.id);
      if (ex) return prev.map(l => l.id === i.id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { id: i.id, name: i.name, emoji: i.emoji, price: i.price, qty: 1 }];
    });
  };
  const setQty = (id: string, qty: number) =>
    setCart(prev => qty <= 0 ? prev.filter(l => l.id !== id) : prev.map(l => l.id === id ? { ...l, qty } : l));
  const clearCart = () => { setCart([]); setDiscount(""); setTable(""); setCustName(""); setCustPhone(""); };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2600); };

  const placeOrder = async (printAfter: boolean) => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart, orderType, paymentMethod: payMethod,
          discount: discountNum,
          customerName: custName, customerPhone: custPhone,
          tableNumber: orderType === "dine-in" ? table : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to place order"); return; }

      if (printAfter) {
        const receipt: ReceiptData = {
          orderId: data.id,
          orderType,
          paymentMethod: payMethod,
          items: cart.map(l => ({ name: l.name, qty: l.qty, price: l.price })),
          subtotal, discount: discountNum, total,
          table: orderType === "dine-in" ? table : "",
          customerName: custName,
          placedAt: new Date().toISOString(),
        };
        printReceipt(receipt);
      }
      showToast(`Order ${data.id} placed · £${data.total.toFixed(2)}`);
      clearCart();
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>
      {/* ── Menu side ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Order type + search */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, background: "var(--a-card)", padding: 5, borderRadius: 12, border: "1px solid var(--a-border)" }}>
            {([
              { id: "dine-in" as const, label: "🍽 Dine In" },
              { id: "takeaway" as const, label: "🥡 Takeaway" },
              { id: "delivery" as const, label: "🛵 Delivery" },
            ]).map(t => (
              <button key={t.id} onClick={() => setOrderType(t.id)} className="a-filter-btn" style={{
                background: orderType === t.id ? "var(--a-orange)" : "transparent",
                borderColor: orderType === t.id ? "var(--a-orange)" : "transparent",
                color: orderType === t.id ? "#fff" : "var(--a-muted)", fontWeight: 600,
              }}>{t.label}</button>
            ))}
          </div>
          {orderType === "dine-in" && (
            <input className="a-input" placeholder="Table #" value={table} onChange={e => setTable(e.target.value)}
              style={{ width: 90, padding: "8px 12px", background: "var(--a-input-bg)", border: "1px solid var(--a-border)", borderRadius: 10, color: "inherit", fontSize: 13 }} />
          )}
          <div className="a-search" style={{ flex: "1 1 200px" }}>
            <SearchIcon />
            <input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map(c => (
            <button key={c} className={`a-filter-btn ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>

        {/* Item grid */}
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--a-muted)" }}>Loading menu…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
            {filtered.map(i => (
              <button key={i.id} onClick={() => add(i)} className="a-card" style={{ padding: 14, textAlign: "left", cursor: "pointer", border: "1px solid var(--a-border)", transition: "transform 120ms" }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{i.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{i.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 800, color: "var(--a-orange-l)", fontSize: 15 }}>£{i.price.toFixed(2)}</span>
                  <span style={{ fontSize: 18, color: "var(--a-green)" }}>＋</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ gridColumn: "1/-1", padding: 40, textAlign: "center", color: "var(--a-muted)" }}>No items found.</div>}
          </div>
        )}
      </div>

      {/* ── Cart side ── */}
      <div className="a-card pos-cart" style={{ padding: 0, position: "sticky", top: 16, display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 90px)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--a-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Current Order</div>
          <span style={{ fontSize: 12, color: "var(--a-muted)" }}>{count} item{count === 1 ? "" : "s"}</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px", minHeight: 80 }}>
          {cart.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--a-muted)", fontSize: 13 }}>Cart is empty — tap items to add.</div>
          ) : cart.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--a-border)" }}>
              <span style={{ fontSize: 20 }}>{l.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                <div style={{ fontSize: 12, color: "var(--a-orange-l)", fontWeight: 700 }}>£{(l.price * l.qty).toFixed(2)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setQty(l.id, l.qty - 1)} className="pos-qty-btn">−</button>
                <span style={{ minWidth: 20, textAlign: "center", fontSize: 13, fontWeight: 600 }}>{l.qty}</span>
                <button onClick={() => setQty(l.id, l.qty + 1)} className="pos-qty-btn">+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--a-border)", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Customer (optional) */}
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Customer name (optional)" value={custName} onChange={e => setCustName(e.target.value)}
              style={{ flex: 1, padding: "8px 10px", background: "var(--a-input-bg)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 12 }} />
            <input placeholder="Phone" value={custPhone} onChange={e => setCustPhone(e.target.value)}
              style={{ width: 110, padding: "8px 10px", background: "var(--a-input-bg)", border: "1px solid var(--a-border)", borderRadius: 8, color: "inherit", fontSize: 12 }} />
          </div>

          {/* Payment method */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["cash", "card"] as const).map(m => (
              <button key={m} onClick={() => setPayMethod(m)} className="a-filter-btn" style={{
                flex: 1, textTransform: "capitalize",
                background: payMethod === m ? "rgba(16,185,129,0.15)" : "transparent",
                borderColor: payMethod === m ? "var(--a-green)" : "var(--a-border)",
                color: payMethod === m ? "#34d399" : "var(--a-muted)", fontWeight: 600,
              }}>{m === "cash" ? "💵 Cash" : "💳 Card"}</button>
            ))}
          </div>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--a-muted)" }}>
            <span>Subtotal</span><span>£{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "var(--a-muted)" }}>
            <span>Discount £</span>
            <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0.00"
              style={{ width: 80, padding: "4px 8px", background: "var(--a-input-bg)", border: "1px solid var(--a-border)", borderRadius: 6, color: "inherit", fontSize: 12, textAlign: "right" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, paddingTop: 8, borderTop: "1px solid var(--a-border)" }}>
            <span>Total</span><span style={{ color: "var(--a-orange-l)" }}>£{total.toFixed(2)}</span>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button className="a-filter-btn" onClick={clearCart} disabled={cart.length === 0} style={{ flex: "0 0 auto" }}>Clear</button>
            <button className="admin-action-btn" onClick={() => placeOrder(false)} disabled={cart.length === 0 || placing} style={{ flex: 1, opacity: (cart.length === 0 || placing) ? 0.5 : 1 }}>
              {placing ? "…" : "Place Order"}
            </button>
            <button className="admin-action-btn" onClick={() => placeOrder(true)} disabled={cart.length === 0 || placing} title="Place order & print receipt"
              style={{ flex: "0 0 auto", background: "var(--a-green)", opacity: (cart.length === 0 || placing) ? 0.5 : 1 }}>
              🖨 Pay & Print
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "var(--a-card-hi)", border: "1px solid var(--a-green)", color: "#34d399", padding: "12px 24px", borderRadius: 999, fontSize: 14, fontWeight: 600, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ flexShrink: 0, color: "var(--a-muted)" }}>
      <circle cx={11} cy={11} r={8} /><line x1={21} y1={21} x2={16.65} y2={16.65} />
    </svg>
  );
}
