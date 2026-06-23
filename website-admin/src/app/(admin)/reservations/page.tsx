"use client";

import { useState, useEffect, useMemo } from "react";

type Reservation = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  reservationDate?: string;
  reservationTime?: string;
  partySize?: number;
  eventDate?: string;
  eventGuests?: number;
  eventType?: string;
  replyText?: string;
  repliedAt?: string;
};

type MessageStatusEntry = { id: number; value: string; label: string; color: string; bg: string };

const FALLBACK_MESSAGE_STATUSES: MessageStatusEntry[] = [
  { id: 1, value: "unread",    label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)"   },
  { id: 2, value: "read",      label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)"   },
  { id: 3, value: "confirmed", label: "Confirmed", color: "#10b981", bg: "rgba(16,185,129,0.12)"   },
  { id: 4, value: "declined",  label: "Declined",  color: "#ef4444", bg: "rgba(239,68,68,0.12)"    },
  { id: 5, value: "replied",   label: "Replied",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)"   },
];

function isStatusPending(status: string): boolean {
  return status === "unread" || status === "read";
}

function formatDate(s: string | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatDateShort(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekEnd() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageStatuses, setMessageStatuses] = useState<MessageStatusEntry[]>(FALLBACK_MESSAGE_STATUSES);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "declined">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "today" | "week">("upcoming");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchReservations = () => {
    setLoading(true);
    fetch("/api/admin/reservations")
      .then(r => r.ok ? r.json() : [])
      .then(data => setReservations(Array.isArray(data) ? data : []))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservations();
    fetch("/api/admin/config/message-statuses")
      .then(r => r.ok ? r.json() : null)
      .then((data: MessageStatusEntry[] | null) => { if (data && data.length > 0) setMessageStatuses(data); })
      .catch(() => {});
  }, []);

  const statusMeta = Object.fromEntries(messageStatuses.map(s => [s.value, { label: s.label, color: s.color, bg: s.bg }]));

  const getDisplayStatus = (status: string): string => statusMeta[status]?.label ?? "Pending";

  const updateStatus = async (id: number, newStatus: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setReservations(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    } finally {
      setActionLoading(null);
    }
  };

  const sendReply = async (id: number) => {
    const text = replyDrafts[id]?.trim();
    if (!text) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: text }),
      });
      const updated = await res.json();
      setReservations(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      setReplyDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    let list = reservations;

    // Status filter
    if (statusFilter === "pending") {
      list = list.filter(r => isStatusPending(r.status));
    } else if (statusFilter === "confirmed") {
      list = list.filter(r => r.status === "confirmed");
    } else if (statusFilter === "declined") {
      list = list.filter(r => r.status === "declined");
    }

    // Date filter
    const today = todayStr();
    const weekEndDate = weekEnd();
    if (dateFilter === "upcoming") {
      list = list.filter(r => {
        const d = r.reservationDate ?? r.eventDate;
        return !d || d >= today;
      });
    } else if (dateFilter === "today") {
      list = list.filter(r => {
        const d = r.reservationDate ?? r.eventDate;
        return d === today;
      });
    } else if (dateFilter === "week") {
      list = list.filter(r => {
        const d = r.reservationDate ?? r.eventDate;
        return d && d >= today && d <= weekEndDate;
      });
    }

    return list;
  }, [reservations, statusFilter, dateFilter]);

  // Summary stats
  const pending = reservations.filter(r => isStatusPending(r.status)).length;
  const today = todayStr();
  const confirmedToday = reservations.filter(r => r.status === "confirmed" && (r.reservationDate === today || r.eventDate === today)).length;
  const weekEndDate = weekEnd();
  const confirmedThisWeek = reservations.filter(r =>
    r.status === "confirmed" &&
    ((r.reservationDate && r.reservationDate >= today && r.reservationDate <= weekEndDate) ||
     (r.eventDate && r.eventDate >= today && r.eventDate <= weekEndDate))
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats */}
      <div className="a-grid-stats">
        {[
          { label: "Total",            value: reservations.length, color: "#ea580c" },
          { label: "Pending",          value: pending,             color: "#f59e0b" },
          { label: "Confirmed Today",  value: confirmedToday,      color: "#10b981" },
          { label: "Confirmed This Week", value: confirmedThisWeek, color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: 28 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "pending", "confirmed", "declined"] as const).map(s => (
            <button key={s} className={statusFilter === s ? "admin-action-btn" : "a-filter-btn"}
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 20, background: "var(--a-border)" }} />
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "upcoming", "today", "week"] as const).map(d => (
            <button key={d} className={dateFilter === d ? "admin-action-btn" : "a-filter-btn"}
              style={{ fontSize: 12, padding: "6px 14px" }}
              onClick={() => setDateFilter(d)}>
              {d === "all" ? "All Dates" : d === "upcoming" ? "Upcoming" : d === "today" ? "Today" : "This Week"}
            </button>
          ))}
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading reservations…</div>}

      {/* Table */}
      {!loading && (
        <div className="a-card" style={{ overflowX: "auto" }}>
          <table className="a-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Date</th>
                <th>Time</th>
                <th>Party</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const sMeta = statusMeta[r.status] ?? statusMeta["unread"];
                const date = r.reservationDate ?? r.eventDate;
                const time = r.reservationTime ?? "—";
                const party = r.partySize ?? r.eventGuests;
                const isOpen = expanded === r.id;
                const isLoading = actionLoading === r.id;

                return (
                  <>
                    <tr
                      key={r.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: "var(--a-muted)" }}>{r.email}</div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--a-muted)" }}>{r.subject}</td>
                      <td style={{ fontWeight: 500 }}>{formatDate(date)}</td>
                      <td style={{ color: "var(--a-muted)" }}>{time}</td>
                      <td>{party != null ? `${party} guest${party !== 1 ? "s" : ""}` : "—"}</td>
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
                          background: sMeta.bg, border: `1px solid ${sMeta.color}40`, color: sMeta.color,
                        }}>
                          {getDisplayStatus(r.status)}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {r.status !== "confirmed" && (
                            <button
                              className="a-filter-btn"
                              style={{ fontSize: 11, padding: "4px 10px", color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}
                              disabled={isLoading}
                              onClick={() => updateStatus(r.id, "confirmed")}
                            >
                              Confirm
                            </button>
                          )}
                          {r.status !== "declined" && (
                            <button
                              className="a-filter-btn"
                              style={{ fontSize: 11, padding: "4px 10px", color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                              disabled={isLoading}
                              onClick={() => updateStatus(r.id, "declined")}
                            >
                              Decline
                            </button>
                          )}
                          <button
                            className="a-filter-btn"
                            style={{ fontSize: 11, padding: "4px 10px" }}
                            onClick={() => setExpanded(isOpen ? null : r.id)}
                          >
                            {isOpen ? "▲" : "Reply"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={7} style={{ background: "rgba(255,255,255,0.02)", padding: "16px 24px" }}>
                          {/* Message body */}
                          <div style={{ marginBottom: 16, padding: "14px 18px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {r.message || <span style={{ color: "var(--a-muted)" }}>(no message body)</span>}
                          </div>

                          {/* Previous reply */}
                          {r.replyText && (
                            <div style={{ marginBottom: 16, padding: "14px 18px", background: "rgba(16,185,129,0.06)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.2)" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.06em", marginBottom: 8 }}>
                                YOUR REPLY · {r.repliedAt ? formatDateShort(r.repliedAt) : ""}
                              </div>
                              <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{r.replyText}</div>
                            </div>
                          )}

                          {/* Reply box */}
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", marginBottom: 8 }}>
                              {r.replyText ? "Send a follow-up reply" : `Reply to ${r.email}`}
                            </div>
                            <textarea
                              value={replyDrafts[r.id] ?? ""}
                              onChange={e => setReplyDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                              placeholder={`Hi ${r.name.split(" ")[0]}, your reservation is…`}
                              style={{ width: "100%", minHeight: 100, padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "inherit", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, gap: 8 }}>
                              <button
                                className="admin-action-btn"
                                style={{ fontSize: 12, opacity: (!replyDrafts[r.id]?.trim() || isLoading) ? 0.5 : 1 }}
                                disabled={!replyDrafts[r.id]?.trim() || isLoading}
                                onClick={() => sendReply(r.id)}
                              >
                                {isLoading ? "Sending…" : "Send Reply"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "var(--a-muted)" }}>
              {reservations.length === 0 ? "No reservations or catering enquiries yet." : "No results match your filters."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
