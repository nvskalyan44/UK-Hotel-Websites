"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { printReceipt } from "@/lib/receipt";

type OrderStatus = string;

type AdminOrder = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  items: string;
  lineItems?: { name: string; qty: number; price: number }[];
  itemCount: number;
  subtotal?: number;
  discount?: number;
  paymentMethod?: string;
  total: number;
  payment: string;
  status: OrderStatus;
  type: string;
  address: string;
  time: string;
  date: string;
  adminNotes?: string;
  specialInstructions?: string;
  refundAmount?: number | null;
  refundReason?: string | null;
  refundedAt?: string | null;
  placedAt?: string;
};

type Toast = { id: number; message: string };

type StatusEntry = { id: number; value: string; label: string; color: string };

const FALLBACK_STATUSES: StatusEntry[] = [
  { id: 1, value: "pending",          label: "Pending",          color: "#6b7280" },
  { id: 2, value: "confirmed",        label: "Confirmed",        color: "#3b82f6" },
  { id: 3, value: "preparing",        label: "Preparing",        color: "#f59e0b" },
  { id: 4, value: "out-for-delivery", label: "Out for Delivery", color: "#06b6d4" },
  { id: 5, value: "delivered",        label: "Delivered",        color: "#10b981" },
  { id: 6, value: "cancelled",        label: "Cancelled",        color: "#ef4444" },
];

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

function printKitchenTicket(order: AdminOrder) {
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Kitchen Ticket</title>
<style>
  body { font-family: monospace; margin: 0; padding: 20px; background: #fff; color: #000; font-size: 14px; }
  h1 { font-size: 28px; margin: 0 0 4px 0; }
  .divider { border-top: 2px dashed #000; margin: 12px 0; }
  .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; }
  .value { font-size: 14px; margin-bottom: 8px; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table td { padding: 4px 0; vertical-align: top; }
  .qty { width: 30px; font-weight: bold; }
  .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 8px; }
  .type-badge { display: inline-block; padding: 3px 10px; border: 2px solid #000; font-weight: bold; font-size: 13px; text-transform: uppercase; }
</style></head><body>
<div class="label">Kitchen Ticket</div>
<h1>${order.id}</h1>
<div class="divider"></div>
<div class="label">Date &amp; Time</div>
<div class="value">${order.time}, ${order.date}</div>
<div class="label">Order Type</div>
<div class="value"><span class="type-badge">${order.type === "delivery" ? "Delivery" : "Collection"}</span></div>
<div class="divider"></div>
<div class="label">Customer</div>
<div class="value">${order.customer}</div>
${order.phone ? `<div class="label">Phone</div><div class="value">${order.phone}</div>` : ""}
${order.type === "delivery" && order.address ? `<div class="label">Delivery Address</div><div class="value">${order.address}</div>` : ""}
<div class="divider"></div>
<div class="label">Items (${order.itemCount})</div>
<table class="items-table">
${order.items.split(", ").map(item => {
  const match = item.match(/^(.*?)×(\d+)$/) || item.match(/^(.*?)\s×\s*(\d+)$/);
  if (match) return `<tr><td class="qty">×${match[2].trim()}</td><td>${match[1].trim()}</td></tr>`;
  return `<tr><td colspan="2">${item}</td></tr>`;
}).join("")}
</table>
${order.specialInstructions ? `<div class="divider"></div><div class="label">Special Instructions</div><div class="value">${order.specialInstructions}</div>` : ""}
<div class="divider"></div>
<div class="total">Total: £${order.total.toFixed(2)}</div>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

function printCustomerReceipt(order: AdminOrder) {
  const items = order.lineItems && order.lineItems.length > 0
    ? order.lineItems
    : order.items.split(", ").map(s => {
        const m = s.match(/^(.*?)×\s*(\d+)$/);
        return { name: (m ? m[1] : s).replace(/^[^\w£]+/, "").trim(), qty: m ? parseInt(m[2]) : 1, price: 0 };
      });
  const subtotal = order.subtotal ?? order.total;
  printReceipt({
    orderId: order.id,
    orderType: order.type,
    paymentMethod: order.paymentMethod ?? order.payment ?? "card",
    items,
    subtotal,
    discount: order.discount ?? 0,
    total: order.total,
    customerName: order.customer,
    placedAt: order.placedAt ?? new Date().toISOString(),
  });
}

function exportOrdersCSV(orders: AdminOrder[]) {
  const headers = ["Order ID", "Customer", "Email", "Phone", "Items", "Total", "Status", "Payment", "Type", "Address", "Date", "Time"];
  const rows = orders.map(o => [
    o.id, o.customer, o.email, o.phone,
    `"${o.items.replace(/"/g, '""')}"`,
    o.total.toFixed(2), o.status, o.payment, o.type,
    `"${o.address.replace(/"/g, '""')}"`,
    o.date, o.time,
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type RefundModal = {
  order: AdminOrder;
  refundAmount: string;
  refundReason: string;
  loading: boolean;
  error: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [refundModal, setRefundModal] = useState<RefundModal | null>(null);
  const [statusList, setStatusList] = useState<StatusEntry[]>(FALLBACK_STATUSES);
  const prevOrderIds = useRef<Set<string>>(new Set());
  const toastId = useRef(0);

  const addToast = (message: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const fetchOrders = async (isInitial = false) => {
    const res = await fetch("/api/admin/orders");
    const data: AdminOrder[] = await res.json();
    if (!isInitial) {
      const newOrders = data.filter(o => !prevOrderIds.current.has(o.id));
      if (newOrders.length > 0) {
        playBeep();
        newOrders.forEach(o => addToast(`🔔 New order received: ${o.id}`));
        setUnreadCount(prev => prev + newOrders.length);
        // Auto-print: trigger window.print() if enabled in localStorage
        if (typeof window !== "undefined" && localStorage.getItem("admin_auto_print") === "true") {
          window.print();
        }
      }
    }
    prevOrderIds.current = new Set(data.map(o => o.id));
    setOrders(data);
    setNoteValues(prev => {
      const next = { ...prev };
      data.forEach(o => { if (!(o.id in next)) next[o.id] = o.adminNotes ?? ""; });
      return next;
    });
    return data;
  };

  useEffect(() => {
    // Seed localStorage auto_print from API if not already set
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      if (typeof window !== "undefined" && localStorage.getItem("admin_auto_print") === null && d.auto_print) {
        localStorage.setItem("admin_auto_print", d.auto_print);
      }
    }).catch(() => {});

    fetch("/api/admin/config/order-statuses")
      .then(r => r.ok ? r.json() : null)
      .then((data: StatusEntry[] | null) => { if (data && data.length > 0) setStatusList(data); })
      .catch(() => {});

    fetchOrders(true).finally(() => setLoading(false));
    const interval = setInterval(() => fetchOrders(false), 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = orders.filter(o => {
    const matchFilter = filter === "all" || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.items.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const saveNote = async (id: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes: noteValues[id] ?? "" }),
    });
  };

  const applyBulkStatus = async () => {
    const ids = Array.from(selected);
    setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, status: bulkStatus } : o));
    await Promise.all(ids.map(id =>
      fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: bulkStatus }),
      })
    ));
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(o => o.id)));
    }
  };

  const handleRowClick = (id: string) => {
    setExpanded(expanded === id ? null : id);
    setUnreadCount(0);
  };

  const openRefundModal = (order: AdminOrder) => {
    setRefundModal({
      order,
      refundAmount: order.total.toFixed(2),
      refundReason: "",
      loading: false,
      error: "",
    });
  };

  const submitRefund = async () => {
    if (!refundModal) return;
    const amount = parseFloat(refundModal.refundAmount);
    if (isNaN(amount) || amount <= 0) {
      setRefundModal(prev => prev ? { ...prev, error: "Enter a valid refund amount." } : null);
      return;
    }
    if (amount > refundModal.order.total) {
      setRefundModal(prev => prev ? { ...prev, error: `Amount cannot exceed £${refundModal.order.total.toFixed(2)}.` } : null);
      return;
    }
    const orderId = refundModal.order.id;
    setRefundModal(prev => prev ? { ...prev, loading: true, error: "" } : null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundAmount: amount, refundReason: refundModal.refundReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRefundModal(prev => prev ? { ...prev, loading: false, error: data.error ?? "Refund failed." } : null);
        return;
      }
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, payment: data.paymentStatus, refundAmount: data.refundAmount, refundReason: data.refundReason, refundedAt: data.refundedAt }
          : o
      ));
      addToast(`Refund of £${amount.toFixed(2)} processed for order ${orderId}`);
      setRefundModal(null);
    } catch {
      setRefundModal(prev => prev ? { ...prev, loading: false, error: "Network error. Please try again." } : null);
    }
  };

  const counts: Record<string, number> = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] ?? 0) + 1; });

  const statusLabels = Object.fromEntries(statusList.map(s => [s.value, s.label]));
  const statusFilters = [{ label: "All", value: "all" }, ...statusList.map(s => ({ label: s.label, value: s.value }))];
  const summaryPills = statusList.filter(s => !["pending", "cancelled"].includes(s.value));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Toast notifications */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: "#1e293b", border: "1px solid rgba(251,191,36,0.4)", borderRadius: 10,
            padding: "12px 18px", fontSize: 13, fontWeight: 600, color: "#fbbf24",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "fadeIn 0.2s ease",
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={e => { if (e.target === e.currentTarget && !refundModal.loading) setRefundModal(null); }}
        >
          <div style={{
            background: "var(--a-card)", border: "1px solid var(--a-border)",
            borderRadius: 16, padding: 32, width: "100%", maxWidth: 480,
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Process Refund</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--a-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>ORDER ID</div>
                  <div style={{ fontWeight: 700, color: "var(--a-orange-l)" }}>{refundModal.order.id}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: "var(--a-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>ORDER TOTAL</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>£{refundModal.order.total.toFixed(2)}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", display: "block", marginBottom: 6 }}>
                  Refund Amount (max £{refundModal.order.total.toFixed(2)})
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--a-muted)" }}>£</span>
                  <input
                    type="number"
                    min="0.01"
                    max={refundModal.order.total}
                    step="0.01"
                    value={refundModal.refundAmount}
                    onChange={e => setRefundModal(prev => prev ? { ...prev, refundAmount: e.target.value, error: "" } : null)}
                    style={{
                      flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--a-border)", borderRadius: 8,
                      color: "var(--a-text)", fontSize: 16, fontWeight: 600, outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", display: "block", marginBottom: 6 }}>
                  Refund Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wrong items, customer complaint…"
                  value={refundModal.refundReason}
                  onChange={e => setRefundModal(prev => prev ? { ...prev, refundReason: e.target.value } : null)}
                  style={{
                    width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--a-border)", borderRadius: 8,
                    color: "var(--a-text)", fontSize: 14, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {refundModal.error && (
                <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#f87171" }}>
                  {refundModal.error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  className="a-filter-btn"
                  onClick={() => setRefundModal(null)}
                  disabled={refundModal.loading}
                  style={{ fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  className="admin-action-btn"
                  onClick={submitRefund}
                  disabled={refundModal.loading}
                  style={{ fontSize: 13, opacity: refundModal.loading ? 0.6 : 1 }}
                >
                  {refundModal.loading ? "Processing…" : "Confirm Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary pills */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {summaryPills.map(s => (
          <div key={s.value} className="a-card" style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{counts[s.value] ?? 0}</div>
              <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{s.label}</div>
            </div>
          </div>
        ))}
        {unreadCount > 0 && (
          <div style={{
            background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)",
            borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, color: "#fbbf24",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            🔔 {unreadCount} new order{unreadCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "center",
        }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{selected.size} order{selected.size > 1 ? "s" : ""} selected</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value as OrderStatus)}
            className="status-select"
            style={{ minWidth: 160 }}
          >
            {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="admin-action-btn" style={{ padding: "6px 16px", fontSize: 12 }} onClick={applyBulkStatus}>
            Apply
          </button>
          <button className="a-filter-btn" style={{ fontSize: 12 }} onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div className="a-search" style={{ flex: "1 1 240px", minWidth: 0 }}>
          <SearchIcon />
          <input placeholder="Search order ID, customer, items…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {statusFilters.map(f => (
            <button key={f.value} className={`a-filter-btn ${filter === f.value ? "active" : ""}`}
              onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        <button className="a-filter-btn" style={{ fontSize: 12, padding: "6px 14px" }}
          onClick={() => exportOrdersCSV(filtered)}>
          📥 Export CSV
        </button>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading orders…</div>}

      {/* Table */}
      {!loading && (
        <div className="a-card" style={{ overflowX: "auto" }}>
          <table className="a-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Order</th><th>Customer</th><th>Items</th><th>Total</th>
                <th>Payment</th><th>Status</th><th>Time</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <Fragment key={order.id}>
                  <tr style={{ cursor: "pointer" }} onClick={() => handleRowClick(order.id)}>
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--a-orange-l)" }}>{order.id}</div>
                      {order.refundAmount != null && (
                        <div style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", display: "inline-block", marginTop: 2 }}>
                          Refunded
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.customer}</div>
                      <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{order.email}</div>
                    </td>
                    <td style={{ color: "var(--a-muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {order.items}
                    </td>
                    <td style={{ fontWeight: 700 }}>£{order.total.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${order.payment === "paid" ? "status-active" : order.payment === "refunded" || order.payment === "partial-refund" ? "status-cancelled" : "status-pending"}`}>
                        {order.payment === "partial-refund" ? "Part Refunded" : order.payment.charAt(0).toUpperCase() + order.payment.slice(1)}
                      </span>
                    </td>
                    <td>
                      <select
                        className="status-select"
                        value={order.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value as OrderStatus); }}
                      >
                        {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ color: "var(--a-muted)" }}>{order.time}, {order.date}</td>
                    <td>
                      <button className="a-filter-btn" style={{ fontSize: 11, padding: "5px 10px" }}
                        onClick={e => { e.stopPropagation(); handleRowClick(order.id); }}>
                        {expanded === order.id ? "▲" : "▼"}
                      </button>
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr>
                      <td colSpan={9} style={{ background: "rgba(255,255,255,0.02)", padding: "16px 24px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, fontSize: 13 }}>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--a-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              {order.type === "delivery" ? "Delivery Address" : "Collection"}
                            </div>
                            <div>{order.address}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--a-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contact</div>
                            <div>{order.phone || "—"}</div>
                            <div style={{ color: "var(--a-muted)" }}>{order.email}</div>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--a-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                              Order Items ({order.itemCount})
                            </div>
                            <div style={{ color: "var(--a-muted)" }}>{order.items}</div>
                          </div>
                        </div>

                        {/* Refund info */}
                        {order.refundAmount != null && (
                          <div style={{ marginTop: 16, padding: "14px 18px", background: "rgba(239,68,68,0.06)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: "0.06em", marginBottom: 8 }}>
                              REFUND PROCESSED · {order.refundedAt ? new Date(order.refundedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                            </div>
                            <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                              <div>
                                <span style={{ color: "var(--a-muted)" }}>Amount: </span>
                                <span style={{ fontWeight: 700 }}>£{order.refundAmount.toFixed(2)}</span>
                              </div>
                              {order.refundReason && (
                                <div>
                                  <span style={{ color: "var(--a-muted)" }}>Reason: </span>
                                  <span>{order.refundReason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--a-border)", display: "flex", justifyContent: "flex-start", gap: 8, flexWrap: "wrap" }}>
                          <button
                            className="a-filter-btn"
                            style={{ fontSize: 12, padding: "6px 14px" }}
                            onClick={() => printKitchenTicket(order)}
                          >
                            🖨️ Print Kitchen Ticket
                          </button>
                          <button
                            className="a-filter-btn"
                            style={{ fontSize: 12, padding: "6px 14px" }}
                            onClick={() => printCustomerReceipt(order)}
                          >
                            🧾 Print Receipt
                          </button>
                          {order.refundAmount == null && order.payment !== "refunded" && (
                            <button
                              className="a-filter-btn"
                              style={{ fontSize: 12, padding: "6px 14px", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                              onClick={() => openRefundModal(order)}
                            >
                              💸 Process Refund
                            </button>
                          )}
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontWeight: 600, marginBottom: 6, color: "var(--a-muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Admin Notes
                          </div>
                          <textarea
                            value={noteValues[order.id] ?? ""}
                            onChange={e => setNoteValues(prev => ({ ...prev, [order.id]: e.target.value }))}
                            onBlur={() => saveNote(order.id)}
                            placeholder="Add internal notes for this order…"
                            rows={3}
                            style={{
                              width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid var(--a-border)",
                              borderRadius: 8, padding: "8px 12px", color: "var(--a-text)", fontSize: 13,
                              resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
                            }}
                          />
                          <button
                            className="a-filter-btn"
                            style={{ marginTop: 6, fontSize: 12, padding: "5px 14px" }}
                            onClick={() => saveNote(order.id)}
                          >
                            Save Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--a-muted)" }}>
              {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
            </div>
          )}
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
