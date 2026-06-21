"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { use } from "react";

/* ── Types ── */

type OrderItem = { name: string; emoji: string; qty: number; price: number };

type TrackingOrder = {
  id: string;
  status: string;
  orderType: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  placedAt: string;
  estimatedMinutes?: number | null;
  customerName?: string;
  deliveryAddress?: string | null;
  deliveryPostcode?: string | null;
  specialInstructions?: string | null;
  items: OrderItem[];
};

/* ── Status config ── */

const DELIVERY_STEPS = [
  { key: "confirmed",          label: "Confirmed",         icon: "📋", desc: "Order received" },
  { key: "preparing",          label: "Preparing",         icon: "👨‍🍳", desc: "Kitchen is on it" },
  { key: "out-for-delivery",   label: "Out for Delivery",  icon: "🚲", desc: "On the way to you" },
  { key: "delivered",          label: "Delivered",         icon: "🎉", desc: "Enjoy your meal!" },
];

const COLLECTION_STEPS = [
  { key: "confirmed",          label: "Confirmed",              icon: "📋", desc: "Order received" },
  { key: "preparing",          label: "Preparing",              icon: "👨‍🍳", desc: "Kitchen is on it" },
  { key: "ready",              label: "Ready for Collection",   icon: "🏪", desc: "Come and collect" },
  { key: "collected",          label: "Collected",              icon: "🎉", desc: "Thank you!" },
];

const STATUS_COLOR: Record<string, string> = {
  pending:             "#6b7280",
  confirmed:           "#3b82f6",
  preparing:           "#f59e0b",
  "out-for-delivery":  "#06b6d4",
  delivered:           "#10b981",
  ready:               "#10b981",
  collected:           "#10b981",
  cancelled:           "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", preparing: "Preparing",
  "out-for-delivery": "Out for Delivery", delivered: "Delivered",
  ready: "Ready for Collection", collected: "Collected", cancelled: "Cancelled",
};

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "preparing", "out-for-delivery", "ready"]);

/* ── Countdown ── */

function Countdown({ placedAt, estimatedMinutes }: { placedAt: string; estimatedMinutes: number }) {
  const [secsLeft, setSecsLeft] = useState(() => {
    const target = new Date(placedAt).getTime() + estimatedMinutes * 60_000;
    return Math.max(0, Math.floor((target - Date.now()) / 1000));
  });

  useEffect(() => {
    if (secsLeft <= 0) return;
    const t = setInterval(() => {
      setSecsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [secsLeft]);

  const mins = Math.floor(secsLeft / 60);
  const secs = secsLeft % 60;

  if (secsLeft <= 0) {
    return (
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Estimated time</div>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: "#10b981" }}>Any moment now!</div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "12px 0" }}>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Estimated time remaining</div>
      <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 32, color: "var(--orange-400)" }}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
    </div>
  );
}

/* ── Progress Stepper ── */

function ProgressStepper({ steps, currentStatus }: { steps: typeof DELIVERY_STEPS; currentStatus: string }) {
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div style={{ position: "relative" }}>
      {/* Track line */}
      <div style={{ position: "absolute", left: 27, top: 27, bottom: 27, width: 2, background: "rgba(253,186,116,0.1)" }} />
      {activeIdx > 0 && (
        <div style={{
          position: "absolute", left: 27, top: 27,
          height: `calc(${(activeIdx / (steps.length - 1)) * 100}% - 8px)`,
          width: 2,
          background: "linear-gradient(to bottom, #3b82f6, var(--orange-500))",
          transition: "height 600ms ease",
        }} />
      )}

      {steps.map((step, i) => {
        const done   = i < activeIdx;
        const active = i === activeIdx;
        const future = i > activeIdx;
        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 18, padding: "14px 0", position: "relative" }}>
            <div style={{
              width: 54, height: 54, borderRadius: "50%", flexShrink: 0,
              background: done
                ? "linear-gradient(135deg, #10b981, #059669)"
                : active
                  ? "linear-gradient(135deg, var(--orange-500), var(--orange-600))"
                  : "rgba(30, 12, 4, 0.6)",
              border: `1px solid ${future ? "rgba(253,186,116,0.1)" : "transparent"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
              boxShadow: active ? "0 0 0 6px rgba(234,88,12,0.15), 0 8px 24px rgba(234,88,12,0.35)" : "none",
              animation: active ? "pulse 2s infinite" : "none",
              transition: "all 300ms",
            }}>
              {step.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: future ? "var(--muted)" : "var(--ink)" }}>{step.label}</div>
              <div className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>{step.desc}</div>
            </div>
            {active && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(234,88,12,0.18)", border: "1px solid rgba(234,88,12,0.35)", color: "var(--orange-300)", animation: "pulse 1.5s infinite" }}>
                In progress
              </span>
            )}
            {done && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}>
                Done
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ── */

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [order, setOrder]     = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelled, setCancelled] = useState(false);

  const fetchOrder = useCallback(() => {
    fetch(`/api/my/orders/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((data) => { if (data) setOrder(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Initial fetch
  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  // Poll every 15 seconds if order is active
  useEffect(() => {
    if (!order || !ACTIVE_STATUSES.has(order.status)) return;
    const t = setInterval(fetchOrder, 15_000);
    return () => clearInterval(t);
  }, [order, fetchOrder]);

  const canCancel = order
    && (order.status === "pending" || order.status === "confirmed")
    && (Date.now() - new Date(order.placedAt).getTime()) < 15 * 60_000;

  const handleCancel = async () => {
    if (!order || !canCancel) return;
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/my/orders/${order.id}/cancel`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        setCancelError(d.error || "Could not cancel order");
      } else {
        setCancelled(true);
        fetchOrder();
      }
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-muted">Loading order…</div>
      </main>
    );
  }

  /* ── Not found ── */
  if (notFound || !order) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔍</div>
          <h1 style={{ fontSize: 32, marginBottom: 12 }}>Order not found</h1>
          <p className="text-muted" style={{ fontSize: 16, marginBottom: 28 }}>
            We couldn&apos;t find order <b style={{ color: "var(--orange-300)" }}>{id}</b>.
          </p>
          <Link href="/" className="btn btn-primary">Back to home</Link>
        </div>
      </main>
    );
  }

  const isDelivery = order.orderType === "delivery";
  const steps = isDelivery ? DELIVERY_STEPS : COLLECTION_STEPS;
  const statusColor = STATUS_COLOR[order.status] ?? "#ea580c";
  const statusLabel = STATUS_LABEL[order.status] ?? order.status;
  const isActive = ACTIVE_STATUSES.has(order.status);
  const isDone   = order.status === "delivered" || order.status === "collected";

  return (
    <main>
      <section style={{ padding: "48px 0 80px" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          {/* Back link */}
          <div style={{ marginBottom: 20 }}>
            <Link href="/" className="text-muted" style={{ fontSize: 13, textDecoration: "none" }}>← Back to home</Link>
          </div>

          {/* Hero status card */}
          <div className="card" style={{
            padding: "40px 36px",
            marginBottom: 24,
            textAlign: "center",
            background: isDone
              ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(234,88,12,0.06))"
              : "linear-gradient(135deg, rgba(234,88,12,0.08), rgba(20,8,4,0.4))",
          }}>
            <div style={{ marginBottom: 6, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--muted)" }}>Order</div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 26, marginBottom: 20 }}>{order.id}</div>

            {/* Status pill with live dot */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 26px", borderRadius: 999, background: `${statusColor}1a`, border: `1px solid ${statusColor}40`, marginBottom: 16 }}>
              {isActive && (
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: statusColor, display: "inline-block",
                  animation: "pulse 1.2s infinite",
                }} />
              )}
              <span style={{ fontWeight: 700, fontSize: 17, color: statusColor }}>{statusLabel}</span>
            </div>

            {/* Countdown */}
            {isActive && order.estimatedMinutes && (
              <div style={{ marginBottom: 8 }}>
                <Countdown placedAt={order.placedAt} estimatedMinutes={order.estimatedMinutes} />
              </div>
            )}

            <div className="text-muted" style={{ fontSize: 13 }}>
              {isDelivery ? "🚲 Delivery" : "🏪 Collection"}
              {" · Placed "}
              {new Date(order.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {/* Progress stepper */}
          {order.status !== "cancelled" && (
            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, marginBottom: 20 }}>Live tracking</h3>
              <ProgressStepper steps={steps} currentStatus={order.status} />
            </div>
          )}

          {/* Cancelled banner */}
          {order.status === "cancelled" && (
            <div className="card" style={{ padding: 28, marginBottom: 24, background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 40 }}>❌</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#f87171" }}>Order cancelled</div>
                  <div className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>This order has been cancelled. Contact us if you have questions.</div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery address */}
          {isDelivery && order.deliveryAddress && (
            <div className="card" style={{ padding: 28, marginBottom: 24 }}>
              <h4 style={{ fontSize: 18, marginBottom: 14 }}>📍 Delivering to</h4>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{order.customerName}</div>
              <div className="text-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {order.deliveryAddress}
                {order.deliveryPostcode && <><br />{order.deliveryPostcode}</>}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="card" style={{ padding: 28, marginBottom: 24 }}>
            <h4 style={{ fontSize: 18, marginBottom: 16 }}>🍽️ Your order</h4>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid rgba(253,186,116,0.06)" }}>
                <span style={{ fontSize: 28 }}>{item.emoji}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{item.name}</span>
                <span className="text-muted" style={{ fontSize: 13, marginRight: 12 }}>×{item.qty}</span>
                <span className="text-orange" style={{ fontWeight: 700 }}>£{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(253,186,116,0.08)" }}>
              {order.discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, color: "#4ade80" }}>
                  <span>Discount</span><span>−£{order.discount.toFixed(2)}</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, color: "var(--ink-dim)" }}>
                  <span>Delivery</span><span>£{order.deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(253,186,116,0.06)" }}>
                <span style={{ fontWeight: 700, fontSize: 17 }}>Total</span>
                <span className="text-orange" style={{ fontWeight: 800, fontSize: 22, fontFamily: "var(--display)" }}>£{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cancel button */}
          {canCancel && !cancelled && (
            <div className="card" style={{ padding: 24, marginBottom: 24, background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Need to cancel?</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>You can cancel within 15 minutes of placing.</div>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="btn btn-ghost btn-sm"
                  style={{ borderColor: "rgba(239,68,68,0.5)", color: "#f87171", opacity: cancelling ? 0.5 : 1 }}
                >
                  {cancelling ? "Cancelling…" : "Cancel order"}
                </button>
              </div>
              {cancelError && (
                <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: "rgba(239,68,68,0.1)", color: "#f87171", fontSize: 13 }}>{cancelError}</div>
              )}
            </div>
          )}

          {/* Bottom actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/" className="btn btn-ghost">Back to home</Link>
            <Link href="/order" className="btn btn-primary">Order again</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
