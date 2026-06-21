"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useConfig } from "@/context/ConfigContext";

const FALLBACK_TIERS = [
  { name: "Bronze", min: 0,    max: 499,  color: "#cd7f32", next: 500  },
  { name: "Silver", min: 500,  max: 1999, color: "#94a3b8", next: 2000 },
  { name: "Gold",   min: 2000, max: Infinity, color: "#f59e0b", next: null },
];

const STATUS_COLOR: Record<string, string> = {
  confirmed:          "#3b82f6",
  preparing:          "#f59e0b",
  "out-for-delivery": "#06b6d4",
  delivered:          "#10b981",
  cancelled:          "#ef4444",
  pending:            "#6b7280",
};
const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed", preparing: "Preparing", "out-for-delivery": "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled", pending: "Pending",
};

type OrderItem = { name: string; emoji: string; qty: number; price: number };
type Order = { id: string; status: string; orderType: string; paymentMethod: string; subtotal: number; discount: number; deliveryFee: number; total: number; placedAt: string; items: OrderItem[] };

function timeAgo(iso: string) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function isRecent(iso: string, recentHours = 3) {
  return Date.now() - new Date(iso).getTime() < 1000 * 60 * 60 * recentHours;
}

/* ── Star rating ── */
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 32, color: (hover || value) >= n ? "#f59e0b" : "rgba(253,186,116,0.2)", transition: "color 120ms", padding: 0 }}
        >★</button>
      ))}
    </div>
  );
}

/* ── Review modal ── */
function ReviewModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating"); return; }
    if (!text.trim()) { setError("Please write a short review"); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/my/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, rating, reviewText: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit"); return; }
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 480, background: "rgba(20,8,4,0.97)", border: "1px solid rgba(253,186,116,0.15)", borderRadius: 20, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22 }}>Rate your order</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(253,186,116,0.05)", borderRadius: 12, border: "1px solid rgba(253,186,116,0.08)" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--orange-300)" }}>{order.id}</div>
          <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{order.items.length} item{order.items.length > 1 ? "s" : ""} · £{order.total.toFixed(2)}</div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div className="field-label" style={{ marginBottom: 10 }}>Overall rating</div>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div className="field">
            <label className="field-label">Your review</label>
            <textarea
              className="field-input"
              rows={4}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Tell us about your experience — food quality, delivery speed, anything you'd like to share…"
              style={{ resize: "vertical" }}
            />
          </div>

          {error && <div style={{ fontSize: 13, color: "#f87171", padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: "center", opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout, refresh } = useUser();
  const cart = useCart();
  const config = useConfig();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("abhi_reviewed") || "[]")); } catch { return new Set(); }
  });

  const [loyaltyTiers, setLoyaltyTiers] = useState(FALLBACK_TIERS);

  const [addresses, setAddresses] = useState<{ id: string; label: string; address: string; postcode: string }[]>([]);
  const [addingAddr, setAddingAddr] = useState(false);
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrLine, setAddrLine] = useState("");
  const [addrPostcode, setAddrPostcode] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [pwMode, setPwMode] = useState(false);

  type SavedCard = { name: string; last4: string; expiry: string; brand: "visa" | "mc" | "amex" | "other" };
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");

  const [billingAddr, setBillingAddr] = useState({ line: "", postcode: "" });
  const [addingBilling, setAddingBilling] = useState(false);
  const [billingLine, setBillingLine] = useState("");
  const [billingPostcode, setBillingPostcode] = useState("");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const fetchOrders = (initial = false) => {
    if (initial) setOrdersLoading(true);
    fetch("/api/my/orders")
      .then(r => r.ok ? r.json() : [])
      .then(setOrders)
      .catch(() => {})
      .finally(() => { if (initial) setOrdersLoading(false); });
  };

  useEffect(() => {
    if (!user) return;
    fetchOrders(true);
    const timer = setInterval(() => fetchOrders(false), 30_000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    fetch("/api/config/loyalty-tiers")
      .then(r => r.ok ? r.json() : null)
      .then((data: { name: string; minPoints: number; maxPoints: number | null; color: string }[] | null) => {
        if (data && data.length > 0) {
          setLoyaltyTiers(data.map((t, i, arr) => ({
            name: t.name,
            min: t.minPoints,
            max: t.maxPoints ?? Infinity,
            color: t.color,
            next: arr[i + 1]?.minPoints ?? null,
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch("/api/my/addresses").then(r => r.ok ? r.json() : []).then(setAddresses).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(`abhi_card_${user.id}`);
      if (raw) setSavedCard(JSON.parse(raw));
      const rawB = localStorage.getItem(`abhi_billing_${user.id}`);
      if (rawB) setBillingAddr(JSON.parse(rawB));
    } catch {}
  }, [user]);

  const detectBrand = (num: string): SavedCard["brand"] => {
    const d = num.replace(/\s/g, "")[0];
    if (d === "4") return "visa";
    if (d === "5" || d === "2") return "mc";
    if (d === "3") return "amex";
    return "other";
  };

  const saveCard = () => {
    const digits = cardNumber.replace(/\s/g, "");
    if (!cardName.trim() || digits.length < 13 || cardExpiry.length < 5) return;
    const card: SavedCard = { name: cardName.trim(), last4: digits.slice(-4), expiry: cardExpiry, brand: detectBrand(digits) };
    setSavedCard(card);
    localStorage.setItem(`abhi_card_${user!.id}`, JSON.stringify(card));
    setAddingCard(false);
    setCardName(""); setCardNumber(""); setCardExpiry("");
  };

  const removeCard = () => {
    setSavedCard(null);
    localStorage.removeItem(`abhi_card_${user!.id}`);
  };

  const saveBilling = () => {
    if (!billingLine.trim() || !billingPostcode.trim()) return;
    const b = { line: billingLine.trim(), postcode: billingPostcode.trim().toUpperCase() };
    setBillingAddr(b);
    localStorage.setItem(`abhi_billing_${user!.id}`, JSON.stringify(b));
    setAddingBilling(false);
    setBillingLine(""); setBillingPostcode("");
  };

  const removeBilling = () => {
    setBillingAddr({ line: "", postcode: "" });
    localStorage.removeItem(`abhi_billing_${user!.id}`);
  };

  const saveAddress = async () => {
    if (!addrLine.trim() || !addrPostcode.trim()) return;
    setAddrSaving(true);
    try {
      const res = await fetch("/api/my/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: addrLabel, address: addrLine, postcode: addrPostcode }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to save address"); return; }
      setAddresses(prev => [...prev, data]);
      setAddingAddr(false);
      setAddrLabel("Home"); setAddrLine(""); setAddrPostcode("");
    } finally {
      setAddrSaving(false);
    }
  };

  const deleteAddress = async (id: string) => {
    await fetch("/api/my/addresses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  if (loading) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-muted">Loading…</div>
      </main>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    cart.clear();
    await logout();
    router.push("/");
  };

  const handleReviewDone = (orderId: string) => {
    const updated = new Set(reviewedIds).add(orderId);
    setReviewedIds(updated);
    localStorage.setItem("abhi_reviewed", JSON.stringify(Array.from(updated)));
    setReviewingOrder(null);
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Cancel this order? This cannot be undone.")) return;
    const res = await fetch(`/api/my/orders/${orderId}/cancel`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Could not cancel order"); return; }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item, i) => {
      const synthetic = {
        id: `reorder-${order.id}-${i}`,
        name: item.name,
        emoji: item.emoji,
        price: item.price,
        veg: false,
        available: true,
        category: "",
        desc: "",
        popular: false,
        hero: false,
        availabilityType: "both",
      };
      for (let q = 0; q < item.qty; q++) cart.add(synthetic);
    });
    cart.setOpen(true);
  };

  const startEdit = () => {
    setEditName(user?.name ?? "");
    setEditPhone(user?.phone ?? "");
    setEditError("");
    setEditMode(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/my/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error || "Failed to save"); return; }
      refresh();
      setEditMode(false);
    } finally {
      setEditSaving(false);
    }
  };

  const savePassword = async () => {
    setPwError("");
    if (pwNew !== pwConfirm) { setPwError("Passwords do not match"); return; }
    if (pwNew.length < config.passwordMinLength) { setPwError(`New password must be at least ${config.passwordMinLength} characters`); return; }
    setPwSaving(true);
    try {
      const res = await fetch("/api/my/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || "Failed to update password"); return; }
      setPwSuccess(true);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      setTimeout(() => { setPwMode(false); setPwSuccess(false); }, 2000);
    } finally {
      setPwSaving(false);
    }
  };

  const tier = loyaltyTiers.find(t => user.loyaltyPoints >= t.min && user.loyaltyPoints <= t.max) ?? loyaltyTiers[0];
  const tierProgress = tier.next ? Math.min(100, ((user.loyaltyPoints - tier.min) / (tier.next - tier.min)) * 100) : 100;

  return (
    <main>
      {reviewingOrder && (
        <ReviewModal
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onDone={() => handleReviewDone(reviewingOrder.id)}
        />
      )}

      <section style={{ padding: "60px 0 80px" }}>
        <div className="container" style={{ maxWidth: 960 }}>

          {/* Profile header */}
          <div className="card" style={{ padding: 36, marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--orange-500), var(--orange-600))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 32, color: "white", flexShrink: 0 }}>
                {user.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 28, marginBottom: 4 }}>{user.name}</h1>
                <div className="text-muted" style={{ fontSize: 14 }}>{user.email}{user.phone ? ` · ${user.phone}` : ""}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div className="text-orange" style={{ fontWeight: 700, fontSize: 20 }}>{user.loyaltyPoints.toLocaleString()}</div>
                    <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Loyalty pts</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>{user.totalOrders}</div>
                    <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Orders</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>£{user.totalSpent.toFixed(2)}</div>
                    <div className="text-muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Total spent</div>
                  </div>
                  <div style={{ marginLeft: 8 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: `${tier.color}22`, border: `1px solid ${tier.color}55`, marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>{tier.name === "Gold" ? "🥇" : tier.name === "Silver" ? "🥈" : "🥉"}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: tier.color }}>{tier.name}</span>
                    </div>
                    <div style={{ width: 120, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{ width: `${tierProgress}%`, height: "100%", background: tier.color, borderRadius: 999, transition: "width 600ms" }} />
                    </div>
                    {tier.next && <div className="text-muted" style={{ fontSize: 10, marginTop: 3 }}>{tier.next - user.loyaltyPoints} pts to {loyaltyTiers[loyaltyTiers.indexOf(tier) + 1]?.name}</div>}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={startEdit} className="btn btn-ghost btn-sm">Edit profile</button>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">Sign out</button>
              </div>
            </div>

            {editMode && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(253,186,116,0.1)" }}>
                <div className="grid-2col" style={{ gap: 14, marginBottom: 14 }}>
                  <div className="field">
                    <label className="field-label">Full name</label>
                    <input className="field-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="field">
                    <label className="field-label">Phone number</label>
                    <input className="field-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+44 7700 900000" />
                  </div>
                </div>
                {editError && <div style={{ fontSize: 13, color: "#f87171", marginBottom: 12 }}>{editError}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit} disabled={editSaving} style={{ opacity: editSaving ? 0.7 : 1 }}>
                    {editSaving ? "Saving…" : "Save changes"}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", fontSize: 12 }} onClick={() => { setEditMode(false); setPwMode(true); setPwError(""); setPwSuccess(false); }}>
                    Change password
                  </button>
                </div>
              </div>
            )}

            {pwMode && (
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(253,186,116,0.1)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Change password</div>
                {pwSuccess ? (
                  <div style={{ fontSize: 14, color: "#4ade80", padding: "12px 16px", background: "rgba(16,185,129,0.08)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.2)" }}>
                    ✓ Password updated successfully
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                      <div className="field">
                        <label className="field-label">Current password</label>
                        <input className="field-input" type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Your current password" />
                      </div>
                      <div className="grid-2col" style={{ gap: 14 }}>
                        <div className="field">
                          <label className="field-label">New password</label>
                          <input className="field-input" type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder={`At least ${config.passwordMinLength} characters`} />
                        </div>
                        <div className="field">
                          <label className="field-label">Confirm new password</label>
                          <input className="field-input" type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Repeat new password" />
                        </div>
                      </div>
                    </div>
                    {pwError && <div style={{ fontSize: 13, color: "#f87171", marginBottom: 12 }}>{pwError}</div>}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPwMode(false)}>Cancel</button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={savePassword} disabled={pwSaving} style={{ opacity: pwSaving ? 0.7 : 1 }}>
                        {pwSaving ? "Saving…" : "Update password"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Saved addresses */}
          <div className="card" style={{ padding: 28, marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Saved addresses</h2>
              {addresses.length < 5 && (
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setAddingAddr(v => !v)}>
                  {addingAddr ? "Cancel" : "+ Add address"}
                </button>
              )}
            </div>

            {addresses.length === 0 && !addingAddr && (
              <div className="text-muted" style={{ fontSize: 14 }}>No saved addresses yet. Add one to speed up checkout.</div>
            )}

            {addresses.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: addingAddr ? 16 : 0 }}>
                {addresses.map(a => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "rgba(253,186,116,0.04)", borderRadius: 12, border: "1px solid rgba(253,186,116,0.08)" }}>
                    <div style={{ fontSize: 22 }}>📍</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--orange-300)", marginBottom: 2 }}>{a.label}</div>
                      <div style={{ fontSize: 13 }}>{a.address}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>{a.postcode}</div>
                    </div>
                    <button onClick={() => deleteAddress(a.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {addingAddr && (
              <div style={{ paddingTop: addresses.length > 0 ? 0 : undefined }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
                  <div className="field">
                    <label className="field-label">Label</label>
                    <input className="field-input" value={addrLabel} onChange={e => setAddrLabel(e.target.value)} placeholder="Home / Work" />
                  </div>
                  <div className="field">
                    <label className="field-label">Street address</label>
                    <input className="field-input" value={addrLine} onChange={e => setAddrLine(e.target.value)} placeholder="123 Fulwood Road" />
                  </div>
                  <div className="field">
                    <label className="field-label">Postcode</label>
                    <input className="field-input" value={addrPostcode} onChange={e => setAddrPostcode(e.target.value)} placeholder="S10 3BD" />
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={saveAddress} disabled={addrSaving || !addrLine.trim() || !addrPostcode.trim()} style={{ opacity: addrSaving ? 0.7 : 1 }}>
                  {addrSaving ? "Saving…" : "Save address"}
                </button>
              </div>
            )}
          </div>

          {/* Saved payment details */}
          <div className="card" style={{ padding: 28, marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 20px" }}>Payment details</h2>

            {/* Saved card */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-dim)" }}>💳 Saved card</div>
                {!savedCard && !addingCard && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setAddingCard(true)}>+ Add card</button>
                )}
              </div>
              {savedCard ? (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(253,186,116,0.04)", borderRadius: 12, border: "1px solid rgba(253,186,116,0.08)" }}>
                  <div style={{ fontSize: 28 }}>
                    {savedCard.brand === "visa" ? "💳" : savedCard.brand === "mc" ? "💳" : savedCard.brand === "amex" ? "💳" : "💳"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {savedCard.brand === "visa" ? "Visa" : savedCard.brand === "mc" ? "Mastercard" : savedCard.brand === "amex" ? "Amex" : "Card"} •••• {savedCard.last4}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{savedCard.name} · Expires {savedCard.expiry}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setAddingCard(true); setCardName(savedCard.name); setCardExpiry(savedCard.expiry); }} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>Edit</button>
                    <button onClick={removeCard} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ) : !addingCard ? (
                <div className="text-muted" style={{ fontSize: 13 }}>No card saved yet.</div>
              ) : null}

              {addingCard && (
                <div style={{ marginTop: savedCard ? 12 : 0 }}>
                  <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
                    <div className="field">
                      <label className="field-label">Name on card</label>
                      <input className="field-input" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Sarah Mitchell" />
                    </div>
                    <div className="field">
                      <label className="field-label">Card number</label>
                      <input className="field-input" value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim())} placeholder="4242 4242 4242 4242" />
                    </div>
                    <div className="field" style={{ maxWidth: 140 }}>
                      <label className="field-label">Expiry (MM/YY)</label>
                      <input className="field-input" value={cardExpiry} onChange={e => setCardExpiry(e.target.value.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2"))} placeholder="MM/YY" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddingCard(false); setCardName(""); setCardNumber(""); setCardExpiry(""); }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={saveCard} disabled={!cardName.trim() || cardNumber.replace(/\s/g, "").length < 13 || cardExpiry.length < 5}>Save card</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid rgba(253,186,116,0.08)", paddingTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-dim)" }}>🏠 Billing address</div>
                {!billingAddr.line && !addingBilling && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setAddingBilling(true)}>+ Add billing address</button>
                )}
              </div>
              {billingAddr.line ? (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "rgba(253,186,116,0.04)", borderRadius: 12, border: "1px solid rgba(253,186,116,0.08)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{billingAddr.line}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>{billingAddr.postcode}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setAddingBilling(true); setBillingLine(billingAddr.line); setBillingPostcode(billingAddr.postcode); }} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>Edit</button>
                    <button onClick={removeBilling} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                  </div>
                </div>
              ) : !addingBilling ? (
                <div className="text-muted" style={{ fontSize: 13 }}>No billing address saved yet.</div>
              ) : null}

              {addingBilling && (
                <div style={{ marginTop: billingAddr.line ? 12 : 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 12, alignItems: "end" }}>
                    <div className="field">
                      <label className="field-label">Street address</label>
                      <input className="field-input" value={billingLine} onChange={e => setBillingLine(e.target.value)} placeholder="12 Sharrow Vale Road" />
                    </div>
                    <div className="field" style={{ maxWidth: 140 }}>
                      <label className="field-label">Postcode</label>
                      <input className="field-input" value={billingPostcode} onChange={e => setBillingPostcode(e.target.value.toUpperCase())} placeholder="S11 8JD" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setAddingBilling(false); setBillingLine(""); setBillingPostcode(""); }}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={saveBilling} disabled={!billingLine.trim() || !billingPostcode.trim()}>Save address</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent live order status */}
          {orders.filter(o => isRecent(o.placedAt, config.orderRecentHours)).map(o => (
            <div key={o.id} className="card" style={{ padding: 24, marginBottom: 20, background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(234,88,12,0.06))", borderColor: `${STATUS_COLOR[o.status] ?? "#ea580c"}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 4 }}>Live order</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{o.id}</div>
                  <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>Placed {timeAgo(o.placedAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""} · £{o.total.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 999, background: `${STATUS_COLOR[o.status] ?? "#ea580c"}22`, border: `1px solid ${STATUS_COLOR[o.status] ?? "#ea580c"}44` }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[o.status] ?? "#ea580c", display: "inline-block", animation: o.status !== "delivered" && o.status !== "cancelled" ? "pulse 1.5s infinite" : "none" }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: STATUS_COLOR[o.status] ?? "var(--orange-300)" }}>{STATUS_LABEL[o.status] ?? o.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Order history */}
          <h2 style={{ fontSize: 22, marginBottom: 16 }}>Order history</h2>

          {ordersLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
              <h3 style={{ fontSize: 22, marginBottom: 8 }}>No orders yet</h3>
              <p className="text-muted" style={{ marginBottom: 24 }}>Your order history will appear here.</p>
              <Link href="/order" className="btn btn-primary">Start your first order</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map(o => (
                <div key={o.id} className="card" style={{ overflow: "hidden" }}>
                  {/* Row */}
                  <div
                    style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", flexWrap: "wrap" }}
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: "var(--orange-300)", fontSize: 15 }}>{o.id}</span>
                        <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999, background: `${STATUS_COLOR[o.status] ?? "#6b7280"}22`, color: STATUS_COLOR[o.status] ?? "var(--muted)", border: `1px solid ${STATUS_COLOR[o.status] ?? "#6b7280"}33`, fontWeight: 600 }}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: 12 }}>
                        {new Date(o.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {" · "}{o.orderType === "delivery" ? "🚲 Delivery" : "🏪 Collection"}
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, color: "var(--orange-300)" }}>£{o.total.toFixed(2)}</div>
                    <div style={{ color: "var(--muted)", fontSize: 18 }}>{expanded === o.id ? "▲" : "▼"}</div>
                  </div>

                  {/* Expanded detail */}
                  {expanded === o.id && (
                    <div style={{ padding: "0 24px 20px", borderTop: "1px solid rgba(253,186,116,0.08)" }}>
                      <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                        {o.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(253,186,116,0.05)" }}>
                            <span style={{ fontSize: 24 }}>{item.emoji}</span>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.name}</span>
                            <span className="text-muted" style={{ fontSize: 13 }}>×{item.qty}</span>
                            <span className="text-orange" style={{ fontWeight: 700, fontSize: 14 }}>£{(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                        <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Subtotal</span><span>£{o.subtotal.toFixed(2)}</span></div>
                          {o.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#4ade80" }}><span>Discount</span><span>−£{o.discount.toFixed(2)}</span></div>}
                          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Delivery</span><span>{o.deliveryFee === 0 ? "FREE" : `£${o.deliveryFee.toFixed(2)}`}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: "1px solid rgba(253,186,116,0.08)", marginTop: 4 }}><span>Total</span><span className="text-orange">£{o.total.toFixed(2)}</span></div>
                        </div>

                        {/* Reorder + Review + Cancel CTAs */}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(253,186,116,0.08)", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReorder(o); }}
                            className="btn btn-primary btn-sm"
                            style={{ display: "flex", alignItems: "center", gap: 6 }}
                          >
                            ↺ Reorder
                          </button>
                          {o.status === "delivered" && !reviewedIds.has(o.id) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReviewingOrder(o); }}
                              className="btn btn-ghost btn-sm"
                              style={{ display: "flex", alignItems: "center", gap: 8, color: "#f59e0b", borderColor: "rgba(245,158,11,0.3)" }}
                            >
                              ★ Rate this order
                            </button>
                          )}
                          {o.status === "delivered" && reviewedIds.has(o.id) && (
                            <span style={{ fontSize: 13, color: "#10b981", display: "flex", alignItems: "center", gap: 6 }}>
                              ✓ Review submitted — thank you!
                            </span>
                          )}
                          {["pending", "confirmed"].includes(o.status) && Date.now() - new Date(o.placedAt).getTime() < config.orderCancelWindowMinutes * 60 * 1000 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); cancelOrder(o.id); }}
                              className="btn btn-ghost btn-sm"
                              style={{ color: "#f87171", borderColor: "rgba(239,68,68,0.25)", marginLeft: "auto" }}
                            >
                              Cancel order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </section>
    </main>
  );
}
