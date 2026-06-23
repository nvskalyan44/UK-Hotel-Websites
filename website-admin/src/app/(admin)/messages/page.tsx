"use client";

import { useState, useEffect, useMemo } from "react";

type Message = {
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

type Tab = "all" | "unread" | "Reservation" | "Catering enquiry" | "Feedback" | "General question" | "replied" | "calendar";

const SUBJECT_META: Record<string, { icon: string; color: string }> = {
  "Reservation":      { icon: "🍽️", color: "#ea580c" },
  "Catering enquiry": { icon: "🎉", color: "#8b5cf6" },
  "Feedback":         { icon: "💬", color: "#3b82f6" },
  "General question": { icon: "❓", color: "#6b7280" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  unread:  { label: "Unread",  color: "#ef4444" },
  read:    { label: "Read",    color: "#6b7280" },
  replied: { label: "Replied", color: "#10b981" },
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [replying, setReplying] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/messages")
      .then(r => r.ok ? r.json() : [])
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: number) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "read" } : m));
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "read" }),
    });
  };

  const sendReply = async (id: number) => {
    const text = replyDrafts[id]?.trim();
    if (!text) return;
    setReplying(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: text }),
      });
      const updated = await res.json();
      setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      setReplyDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setReplying(null);
    }
  };

  const deleteMsg = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    setMessages(prev => prev.filter(m => m.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const unreadCount = messages.filter(m => m.status === "unread").length;

  const filtered = useMemo(() => {
    if (tab === "all") return messages;
    if (tab === "unread") return messages.filter(m => m.status === "unread");
    if (tab === "replied") return messages.filter(m => m.status === "replied");
    return messages.filter(m => m.subject === tab);
  }, [messages, tab]);

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: `All (${messages.length})` },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "Reservation", label: "Reservations" },
    { key: "Catering enquiry", label: "Catering" },
    { key: "Feedback", label: "Feedback" },
    { key: "General question", label: "General" },
    { key: "replied", label: "Replied" },
    { key: "calendar", label: "📅 Calendar" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Stats */}
      <div className="a-grid-stats">
        {[
          { label: "Total Messages",  value: messages.length,                                             color: "#ea580c" },
          { label: "Unread",          value: unreadCount,                                                  color: "#ef4444" },
          { label: "Reservations",    value: messages.filter(m => m.subject === "Reservation").length,    color: "#f59e0b" },
          { label: "Replied",         value: messages.filter(m => m.status === "replied").length,         color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ "--stat-color": s.color } as React.CSSProperties}>
            <div className="stat-value" style={{ fontSize: 28 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={tab === t.key ? "admin-action-btn" : "a-filter-btn"}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--a-muted)" }}>Loading messages…</div>}

      {!loading && tab === "calendar" && <ReservationCalendar messages={messages} />}

      {!loading && tab !== "calendar" && filtered.length === 0 && (
        <div className="a-card" style={{ padding: "40px 0", textAlign: "center", color: "var(--a-muted)" }}>
          No messages in this category.
        </div>
      )}

      {/* Message list */}
      {!loading && tab !== "calendar" && filtered.map(msg => {
        const meta = SUBJECT_META[msg.subject] ?? { icon: "📩", color: "#6b7280" };
        const sMeta = STATUS_META[msg.status] ?? STATUS_META.read;
        const isOpen = expanded === msg.id;

        return (
          <div key={msg.id} className="a-card" style={{ padding: 0, overflow: "hidden", border: msg.status === "unread" ? "1px solid rgba(239,68,68,0.25)" : undefined }}>
            {/* Header row */}
            <div
              onClick={() => {
                const next = isOpen ? null : msg.id;
                setExpanded(next);
                if (msg.status === "unread" && next !== null) markRead(msg.id);
              }}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${meta.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{msg.name}</span>
                  <span style={{ fontSize: 12, color: "var(--a-muted)" }}>{msg.email}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: `${sMeta.color}18`, border: `1px solid ${sMeta.color}40`, color: sMeta.color, marginLeft: "auto" }}>
                    {sMeta.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{msg.subject}</span>
                  {msg.subject === "Reservation" && msg.reservationDate && (
                    <span style={{ fontSize: 11, color: "var(--a-muted)" }}>· {msg.reservationDate} at {msg.reservationTime} · {msg.partySize} guest{(msg.partySize ?? 0) !== 1 ? "s" : ""}</span>
                  )}
                  {msg.subject === "Catering enquiry" && msg.eventDate && (
                    <span style={{ fontSize: 11, color: "var(--a-muted)" }}>· {msg.eventDate} · {msg.eventGuests} guests{msg.eventType ? ` · ${msg.eventType}` : ""}</span>
                  )}
                  <span style={{ fontSize: 11, color: "var(--a-muted)", marginLeft: "auto" }}>
                    {new Date(msg.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {!isOpen && (
                  <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {msg.message}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 16, color: "var(--a-muted)", transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform 200ms", flexShrink: 0 }}>▾</div>
            </div>

            {/* Expanded body */}
            {isOpen && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Detail cards for reservation/catering */}
                {msg.subject === "Reservation" && msg.reservationDate && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <DetailPill icon="📅" label="Date" value={msg.reservationDate} />
                    <DetailPill icon="🕐" label="Time" value={msg.reservationTime ?? "—"} />
                    <DetailPill icon="👥" label="Party" value={`${msg.partySize} guest${(msg.partySize ?? 0) !== 1 ? "s" : ""}`} />
                  </div>
                )}
                {msg.subject === "Catering enquiry" && msg.eventDate && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <DetailPill icon="📅" label="Event date" value={msg.eventDate} />
                    <DetailPill icon="👥" label="Guests" value={`${msg.eventGuests}`} />
                    {msg.eventType && <DetailPill icon="🎊" label="Type" value={msg.eventType} />}
                  </div>
                )}

                {/* Message body */}
                <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.03)", borderRadius: 10, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {msg.message || <span style={{ color: "var(--a-muted)" }}>(no message body)</span>}
                </div>

                {/* Previous reply */}
                {msg.replyText && (
                  <div style={{ padding: "14px 18px", background: "rgba(16,185,129,0.06)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.06em", marginBottom: 8 }}>
                      YOUR REPLY · {msg.repliedAt ? new Date(msg.repliedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.replyText}</div>
                  </div>
                )}

                {/* Reply box */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--a-muted)", marginBottom: 8 }}>
                    {msg.replyText ? "Send a follow-up reply" : `Reply to ${msg.email}`}
                  </div>
                  <textarea
                    value={replyDrafts[msg.id] ?? ""}
                    onChange={e => setReplyDrafts(prev => ({ ...prev, [msg.id]: e.target.value }))}
                    placeholder={`Hi ${msg.name.split(" ")[0]}, thank you for your message…`}
                    style={{ width: "100%", minHeight: 100, padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "inherit", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.6 }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: "var(--a-muted)" }}>
                      Reply will be saved and visible here. In production, an email would be sent to <b style={{ color: "var(--a-text)" }}>{msg.email}</b>.
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="a-filter-btn"
                        style={{ fontSize: 12, color: "var(--a-red)", borderColor: "rgba(239,68,68,0.25)" }}
                        onClick={() => deleteMsg(msg.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="admin-action-btn"
                        style={{ fontSize: 12, opacity: (!replyDrafts[msg.id]?.trim() || replying === msg.id) ? 0.5 : 1 }}
                        disabled={!replyDrafts[msg.id]?.trim() || replying === msg.id}
                        onClick={() => sendReply(msg.id)}
                      >
                        {replying === msg.id ? "Sending…" : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReservationCalendar({ messages }: { messages: Message[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const reservations = messages.filter(m => m.subject === "Reservation" && m.reservationDate);

  const byDate: Record<string, Message[]> = {};
  reservations.forEach(m => {
    const key = m.reservationDate!;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(m);
  });

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="a-card" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className="a-filter-btn" onClick={() => { const d = new Date(viewYear, viewMonth - 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}>‹ Prev</button>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{monthName}</div>
        <button className="a-filter-btn" onClick={() => { const d = new Date(viewYear, viewMonth + 1); setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }}>Next ›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--a-muted)", padding: "6px 0", letterSpacing: "0.06em" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const bookings = byDate[dateStr] ?? [];
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          return (
            <div key={day} style={{ minHeight: 70, padding: 6, borderRadius: 8, background: bookings.length > 0 ? "rgba(234,88,12,0.08)" : "rgba(255,255,255,0.02)", border: isToday ? "1px solid rgba(234,88,12,0.5)" : "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? "var(--a-orange-l)" : "var(--a-text)", marginBottom: 4 }}>{day}</div>
              {bookings.map(b => (
                <div key={b.id} style={{ fontSize: 9, padding: "2px 5px", borderRadius: 4, background: "rgba(234,88,12,0.2)", color: "var(--a-orange-l)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={`${b.name} · ${b.reservationTime} · ${b.partySize} guests`}>
                  {b.reservationTime} {b.name.split(" ")[0]} ({b.partySize})
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {reservations.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 0", color: "var(--a-muted)", fontSize: 13 }}>No reservations this month.</div>
      )}
    </div>
  );
}

function DetailPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: "var(--a-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>{label.toUpperCase()}</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}
