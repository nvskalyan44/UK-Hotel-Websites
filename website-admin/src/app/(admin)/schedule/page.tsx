"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";

/* ── Types ── */

interface ScheduledOrder {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  orderType: string;
  status: string;
  total: number;
  itemCount: number;
  scheduledTime: string;
  placedAt: string;
}

interface Reservation {
  id: number;
  name: string;
  email: string;
  date: string | null;
  time: string | null;
  partySize: number | null;
  status: string;
}

/* ── Config ── */

const STATUS_COLORS: Record<string, string> = {
  pending:           "#6b7280",
  confirmed:         "#3b82f6",
  preparing:         "#f59e0b",
  "out-for-delivery": "#06b6d4",
  delivered:         "#10b981",
  ready:             "#10b981",
  collected:         "#10b981",
  cancelled:         "#ef4444",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 12 }, (_, i) => 11 + i); // 11:00 – 22:00

/* ── Helpers ── */

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/* ── Mini Detail Popup ── */

function OrderPopup({ order, onClose }: { order: ScheduledOrder; onClose: () => void }) {
  const color = STATUS_COLORS[order.status] ?? "#ea580c";
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#1c1409", border: "1px solid rgba(253,186,116,0.18)", borderRadius: 16, padding: 28, minWidth: 320, maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: "#a0917e", marginBottom: 4 }}>Order #{order.id.slice(-8)}</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#f5f0eb" }}>{order.customerName}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0917e", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}44` }}>
            {order.status}
          </span>
          <span style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, background: "rgba(253,186,116,0.1)", color: "#a0917e", border: "1px solid rgba(253,186,116,0.15)" }}>
            {order.orderType === "delivery" ? "🚲 Delivery" : "🏪 Collection"}
          </span>
        </div>
        <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a0917e" }}>Scheduled</span>
            <span style={{ fontWeight: 600, color: "#f5f0eb" }}>{new Date(order.scheduledTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} at {fmtTime(order.scheduledTime)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a0917e" }}>Items</span>
            <span style={{ fontWeight: 600, color: "#f5f0eb" }}>{order.itemCount}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a0917e" }}>Total</span>
            <span style={{ fontWeight: 700, color: "#fb923c" }}>£{order.total.toFixed(2)}</span>
          </div>
          {order.customerPhone && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#a0917e" }}>Phone</span>
              <span style={{ color: "#f5f0eb" }}>{order.customerPhone}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
          <Link href={`/orders?search=${order.id}`} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.3)", color: "#fb923c", fontSize: 13, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
            View order →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Reservation popup ── */

function ReservationPopup({ res, onClose }: { res: Reservation; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#1c1409", border: "1px solid rgba(253,186,116,0.18)", borderRadius: 16, padding: 28, minWidth: 320, maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: "#a0917e", marginBottom: 4 }}>Reservation #{res.id}</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#f5f0eb" }}>{res.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#a0917e", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a0917e" }}>Date</span>
            <span style={{ fontWeight: 600, color: "#f5f0eb" }}>{res.date ?? "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a0917e" }}>Time</span>
            <span style={{ fontWeight: 600, color: "#f5f0eb" }}>{res.time ?? "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a0917e" }}>Party size</span>
            <span style={{ fontWeight: 600, color: "#f5f0eb" }}>{res.partySize ?? "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a0917e" }}>Email</span>
            <span style={{ color: "#f5f0eb" }}>{res.email}</span>
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <Link href={`/messages`} style={{ display: "block", padding: "10px 16px", borderRadius: 10, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa", fontSize: 13, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
            View in messages →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [orders, setOrders] = useState<ScheduledOrder[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ScheduledOrder | null>(null);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "list">("week");

  const weekEnd = addDays(weekStart, 6);

  const fetchData = useCallback(() => {
    setLoading(true);
    const from = weekStart.toISOString();
    const to   = addDays(weekStart, 7).toISOString();
    fetch(`/api/admin/orders/scheduled?from=${from}&to=${to}`)
      .then((r) => r.ok ? r.json() : { orders: [], reservations: [] })
      .then((data) => {
        setOrders(data.orders ?? []);
        setReservations(data.reservations ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const ordersForDay = (day: Date) => {
    const iso = isoDate(day);
    return orders.filter((o) => o.scheduledTime && isoDate(new Date(o.scheduledTime)) === iso);
  };

  const reservationsForDay = (day: Date) => {
    const iso = isoDate(day);
    return reservations.filter((r) => r.date === iso);
  };

  const today = isoDate(new Date());

  return (
    <>
      {selectedOrder && <OrderPopup order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {selectedRes   && <ReservationPopup res={selectedRes}  onClose={() => setSelectedRes(null)} />}

      <div style={{ padding: "0 0 40px" }}>
        {/* Header controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(253,186,116,0.06)", border: "1px solid rgba(253,186,116,0.12)", color: "#f5f0eb", cursor: "pointer", fontSize: 16 }}
            >
              ‹
            </button>
            <div style={{ textAlign: "center", minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#f5f0eb" }}>
                {weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(253,186,116,0.06)", border: "1px solid rgba(253,186,116,0.12)", color: "#f5f0eb", cursor: "pointer", fontSize: 16 }}
            >
              ›
            </button>
          </div>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(234,88,12,0.12)", border: "1px solid rgba(234,88,12,0.25)", color: "#fb923c", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Today
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {(["week", "list"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: viewMode === m ? "rgba(234,88,12,0.18)" : "rgba(253,186,116,0.04)", border: `1px solid ${viewMode === m ? "rgba(234,88,12,0.4)" : "rgba(253,186,116,0.1)"}`, color: viewMode === m ? "#fb923c" : "#a0917e", cursor: "pointer", textTransform: "capitalize" }}
              >
                {m}
              </button>
            ))}
          </div>
          <button onClick={fetchData} style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(253,186,116,0.04)", border: "1px solid rgba(253,186,116,0.1)", color: "#a0917e", cursor: "pointer", fontSize: 13 }}>
            ↻ Refresh
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { label: "Confirmed",    color: "#3b82f6" },
            { label: "Preparing",    color: "#f59e0b" },
            { label: "Ready",        color: "#10b981" },
            { label: "Cancelled",    color: "#ef4444" },
            { label: "Reservation",  color: "#8b5cf6" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a0917e" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />
              {l.label}
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#a0917e" }}>Loading schedule…</div>
        ) : viewMode === "week" ? (

          /* ── Week grid ── */
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 700, display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", gap: 0, border: "1px solid rgba(253,186,116,0.1)", borderRadius: 14, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ background: "rgba(20,8,4,0.5)", padding: "10px 0", borderBottom: "1px solid rgba(253,186,116,0.1)" }} />
              {days.map((day) => {
                const iso = isoDate(day);
                const isToday = iso === today;
                return (
                  <div key={iso} style={{
                    background: isToday ? "rgba(234,88,12,0.1)" : "rgba(20,8,4,0.5)",
                    padding: "10px 8px", textAlign: "center",
                    borderBottom: "1px solid rgba(253,186,116,0.1)",
                    borderLeft: "1px solid rgba(253,186,116,0.06)",
                  }}>
                    <div style={{ fontSize: 11, color: "#a0917e", textTransform: "uppercase", letterSpacing: "0.1em" }}>{DAYS[day.getDay()]}</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: isToday ? "#fb923c" : "#f5f0eb", marginTop: 2 }}>{day.getDate()}</div>
                  </div>
                );
              })}

              {/* Hour rows */}
              {HOURS.map((hour) => (
                <Fragment key={hour}>
                  <div style={{ padding: "8px 8px 0", fontSize: 11, color: "#6b5a48", textAlign: "right", borderBottom: "1px solid rgba(253,186,116,0.04)", borderRight: "1px solid rgba(253,186,116,0.06)", background: "rgba(16,8,4,0.3)" }}>
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {days.map((day) => {
                    const iso = isoDate(day);
                    const dayOrders = ordersForDay(day).filter((o) => new Date(o.scheduledTime).getHours() === hour);
                    const dayResv = reservationsForDay(day).filter((r) => {
                      if (!r.time) return hour === 12;
                      const h = parseInt(r.time.split(":")[0]);
                      return h === hour;
                    });
                    const isToday = iso === today;
                    return (
                      <div key={`${iso}-${hour}`} style={{
                        minHeight: 50, padding: "4px 4px", display: "flex", flexDirection: "column", gap: 3,
                        borderBottom: "1px solid rgba(253,186,116,0.04)",
                        borderLeft: "1px solid rgba(253,186,116,0.06)",
                        background: isToday ? "rgba(234,88,12,0.04)" : "transparent",
                      }}>
                        {dayOrders.map((o) => {
                          const c = STATUS_COLORS[o.status] ?? "#ea580c";
                          return (
                            <button
                              key={o.id}
                              onClick={() => setSelectedOrder(o)}
                              style={{
                                padding: "3px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                                background: `${c}22`, border: `1px solid ${c}55`, color: c,
                                textAlign: "left", cursor: "pointer", lineHeight: 1.4, width: "100%",
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}
                            >
                              {fmtTime(o.scheduledTime)} {o.customerName.split(" ")[0]}
                            </button>
                          );
                        })}
                        {dayResv.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setSelectedRes(r)}
                            style={{
                              padding: "3px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                              background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.4)", color: "#a78bfa",
                              textAlign: "left", cursor: "pointer", lineHeight: 1.4, width: "100%",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}
                          >
                            {r.time ?? "?"} {r.name.split(" ")[0]} ({r.partySize ?? "?"}p)
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

        ) : (
          /* ── List view ── */
          <div style={{ display: "grid", gap: 16 }}>
            {days.map((day) => {
              const iso = isoDate(day);
              const dayOrders = ordersForDay(day);
              const dayResv   = reservationsForDay(day);
              if (dayOrders.length === 0 && dayResv.length === 0) return null;
              const isToday = iso === today;
              return (
                <div key={iso} style={{ background: isToday ? "rgba(234,88,12,0.06)" : "rgba(20,8,4,0.3)", border: `1px solid ${isToday ? "rgba(234,88,12,0.25)" : "rgba(253,186,116,0.1)"}`, borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(253,186,116,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, color: isToday ? "#fb923c" : "#f5f0eb" }}>
                      {day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    {isToday && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(234,88,12,0.2)", color: "#fb923c" }}>Today</span>}
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#a0917e" }}>{dayOrders.length} order{dayOrders.length !== 1 ? "s" : ""}{dayResv.length > 0 ? ` · ${dayResv.length} reservation${dayResv.length !== 1 ? "s" : ""}` : ""}</span>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    {dayOrders.map((o) => {
                      const c = STATUS_COLORS[o.status] ?? "#ea580c";
                      return (
                        <button
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid rgba(253,186,116,0.04)" }}
                        >
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#f5f0eb", flex: 1 }}>{fmtTime(o.scheduledTime)} · {o.customerName}</span>
                          <span style={{ fontSize: 12, color: "#a0917e", marginRight: 8 }}>{o.orderType === "delivery" ? "🚲" : "🏪"} {o.itemCount} item{o.itemCount !== 1 ? "s" : ""}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#fb923c" }}>£{o.total.toFixed(2)}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${c}22`, color: c, marginLeft: 4 }}>{o.status}</span>
                        </button>
                      );
                    })}
                    {dayResv.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRes(r)}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderBottom: "1px solid rgba(253,186,116,0.04)" }}
                      >
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#8b5cf6", flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: 14, color: "#f5f0eb", flex: 1 }}>{r.time ?? "?"} · {r.name}</span>
                        <span style={{ fontSize: 12, color: "#a0917e" }}>🪑 {r.partySize ?? "?"} guests</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(139,92,246,0.18)", color: "#a78bfa", marginLeft: 4 }}>reservation</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {orders.length === 0 && reservations.length === 0 && (
              <div style={{ padding: 48, textAlign: "center", color: "#a0917e" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <div>No scheduled orders or reservations this week.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
