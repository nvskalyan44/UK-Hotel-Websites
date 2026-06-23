"use client";

import { useState, useEffect, useCallback } from "react";

type KDSOrder = {
  id: string;
  customer: string;
  items: string;
  itemCount: number;
  total: number;
  status: string;
  type: string;
  placedAt?: string;
  time: string;
  date: string;
};

type KdsStatusEntry = {
  value: string;
  label: string;
  color: string;
  kdsLabel: string;
  nextStatus: string;
  kdsActionLabel: string;
  kdsBgColor: string;
};

const FALLBACK_KDS: KdsStatusEntry[] = [
  { value: "pending",   label: "Pending",   color: "#f59e0b", kdsLabel: "New Orders",  nextStatus: "confirmed", kdsActionLabel: "Confirm",         kdsBgColor: "rgba(245,158,11,0.08)" },
  { value: "confirmed", label: "Confirmed", color: "#3b82f6", kdsLabel: "Confirmed",   nextStatus: "preparing", kdsActionLabel: "Start Preparing", kdsBgColor: "rgba(59,130,246,0.08)" },
  { value: "preparing", label: "Preparing", color: "#8b5cf6", kdsLabel: "Preparing",   nextStatus: "ready",     kdsActionLabel: "Mark Ready",       kdsBgColor: "rgba(139,92,246,0.08)" },
];

function timeAgo(placedAt: string | undefined, fallbackTime: string): string {
  if (!placedAt) return fallbackTime;
  const diff = Math.floor((Date.now() - new Date(placedAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [kdsStatuses, setKdsStatuses] = useState<KdsStatusEntry[]>(FALLBACK_KDS);

  const KDS_VALUES = kdsStatuses.map(s => s.value);
  const columnMeta: Record<string, { label: string; color: string; bg: string }> = Object.fromEntries(kdsStatuses.map(s => [s.value, { label: s.kdsLabel, color: s.color, bg: s.kdsBgColor }]));
  const nextStatusMap: Record<string, string> = Object.fromEntries(kdsStatuses.map(s => [s.value, s.nextStatus]));
  const nextLabelMap: Record<string, string> = Object.fromEntries(kdsStatuses.map(s => [s.value, s.kdsActionLabel]));

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) return;
      const data: KDSOrder[] = await res.json();
      const active = data.filter(o => KDS_VALUES.includes(o.status));
      setOrders(active);
      setLastRefresh(new Date());
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kdsStatuses]);

  useEffect(() => {
    fetchOrders().finally(() => setLoading(false));
    fetch("/api/admin/config/order-statuses")
      .then(r => r.ok ? r.json() : null)
      .then((data: (KdsStatusEntry & { kdsLabel?: string | null })[] | null) => {
        if (data) {
          const kds = data.filter(s => s.kdsLabel != null) as KdsStatusEntry[];
          if (kds.length > 0) setKdsStatuses(kds);
        }
      })
      .catch(() => {});
    const interval = setInterval(fetchOrders, 30_000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const advanceStatus = async (order: KDSOrder) => {
    const next = nextStatusMap[order.status];
    if (!next) return;
    setAdvancing(prev => new Set(prev).add(order.id));
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (next === "ready") {
        // Remove from board when marked ready
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
      }
    } finally {
      setAdvancing(prev => { const s = new Set(prev); s.delete(order.id); return s; });
    }
  };

  const columns = KDS_VALUES.map(status => ({
    status,
    meta: columnMeta[status],
    orders: orders.filter(o => o.status === status),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🍳</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Kitchen Display</div>
            <div style={{ fontSize: 12, color: "var(--a-muted)" }}>
              {orders.length} active order{orders.length !== 1 ? "s" : ""} · Last refreshed {lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          </div>
        </div>
        <button
          className="admin-action-btn"
          style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => fetchOrders()}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--a-muted)" }}>Loading kitchen orders…</div>
      )}

      {!loading && orders.length === 0 && (
        <div className="a-card" style={{ padding: "60px 0", textAlign: "center", color: "var(--a-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>All caught up!</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>No active orders right now.</div>
        </div>
      )}

      {/* Kanban columns */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, alignItems: "start" }}>
          {columns.map(col => (
            <div key={col.status}>
              {/* Column header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderRadius: "12px 12px 0 0",
                background: col.meta.bg, borderBottom: `2px solid ${col.meta.color}`,
                marginBottom: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.meta.color }} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: col.meta.color }}>{col.meta.label}</span>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 999,
                  background: col.meta.color, color: "#fff",
                }}>
                  {col.orders.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12, background: "rgba(255,255,255,0.01)", borderRadius: "0 0 12px 12px", border: "1px solid var(--a-border)", borderTop: "none", minHeight: 120 }}>
                {col.orders.length === 0 && (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "var(--a-muted)", fontSize: 13 }}>No orders</div>
                )}
                {col.orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    status={col.status}
                    meta={col.meta}
                    nextLabel={nextLabelMap[col.status] ?? ""}
                    advancing={advancing.has(order.id)}
                    onAdvance={() => advanceStatus(order)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  status,
  meta,
  nextLabel,
  advancing,
  onAdvance,
}: {
  order: KDSOrder;
  status: string;
  meta: { label: string; color: string; bg: string };
  nextLabel: string;
  advancing: boolean;
  onAdvance: () => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const itemLines = order.items.split(", ");

  return (
    <div style={{
      background: "var(--a-card)", border: `1px solid ${meta.color}33`,
      borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Order ID + type */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: meta.color, letterSpacing: "-0.02em" }}>{order.id}</div>
        <div style={{
          fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
          background: order.type === "delivery" ? "rgba(6,182,212,0.15)" : "rgba(16,185,129,0.15)",
          color: order.type === "delivery" ? "#06b6d4" : "#10b981",
          border: `1px solid ${order.type === "delivery" ? "rgba(6,182,212,0.3)" : "rgba(16,185,129,0.3)"}`,
        }}>
          {order.type === "delivery" ? "🚲 Delivery" : "🏪 Collection"}
        </div>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {itemLines.map((item, i) => {
          const match = item.match(/^(.*?)\s*×(\d+)$/) || item.match(/^(.*?)×(\d+)$/);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              {match ? (
                <>
                  <span style={{ fontWeight: 800, fontSize: 15, color: "var(--a-text)", minWidth: 28 }}>×{match[2].trim()}</span>
                  <span style={{ color: "var(--a-muted)" }}>{match[1].trim()}</span>
                </>
              ) : (
                <span style={{ color: "var(--a-muted)" }}>{item}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer: time + button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid var(--a-border)" }}>
        <div style={{ fontSize: 11, color: "var(--a-muted)", fontWeight: 600 }}>
          {timeAgo(order.placedAt, order.time)}
        </div>
        <button
          onClick={onAdvance}
          disabled={advancing}
          style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
            background: advancing ? "rgba(255,255,255,0.06)" : meta.color,
            color: advancing ? "var(--a-muted)" : "#fff",
            border: "none", opacity: advancing ? 0.7 : 1, transition: "all 150ms",
          }}
        >
          {advancing ? "…" : nextLabel}
        </button>
      </div>
    </div>
  );
}
